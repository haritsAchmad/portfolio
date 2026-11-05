#Requires -Version 5.1
<#
.SYNOPSIS
  Local, incremental, merge-only backup of portfolio analytics events (Neon PostgreSQL) to CSV files.

.DESCRIPTION
  Archives public.analytics_events into one CSV file per WIB (Asia/Jakarta) date, using a
  read-only database role and psql.exe (PostgreSQL 14 or newer). No other dependencies.
  See docs/ANALYTICS-BACKUP.md for setup and operation.

  The archive only grows: rows are never removed or overwritten because the database
  changed. Rows that disappear from or change in the database are reported as
  discrepancies. Archive files that changed on disk are never replaced automatically.

  Commands:
    status              Configuration, checkpoint, scheduled task, and recent log lines (default).
    check               Connect once and verify the role is read-only. Writes nothing but the log.
    run                 Synchronise every complete WIB day, plus rows with NULL created_at.
    verify              Re-check archived files against the checkpoint (no database access).
    repair              Explicitly rebuild damaged archive files (-Day yyyy-MM-dd, null, or all;
                        add -PreferDatabase to take the database version of rows that differ).
    rebuild-checkpoint  Recreate checkpoint.json from the local archive only (no database access).
    logs                Show the last -Tail log lines.
    set-credential      Prompt for the backup role's password and store it encrypted (Windows DPAPI).
    install             Register the daily Task Scheduler task (01:00 WIB), DISABLED unless -Enable.
    enable / disable    Enable or disable the scheduled task. Archives are not touched.
    uninstall           Remove the scheduled task. Archives are not touched.

  Exit codes: 0 success (warnings possible), 1 error, 2 refused (unsafe configuration or
  write-capable role), 3 another operation in progress, 4 finished but archive files need attention.
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('status', 'check', 'run', 'verify', 'repair', 'rebuild-checkpoint', 'logs', 'set-credential', 'install', 'enable', 'disable', 'uninstall')]
  [string]$Command = 'status',

  # Folder for config, credential, archives, checkpoint, and logs. Must stay out of Git.
  [string]$StateDir,

  [int]$Tail = 40,

  # install: register the task enabled instead of disabled.
  [switch]$Enable,

  # repair: yyyy-MM-dd, 'null' for the NULL created_at file, or 'all' for every damaged file.
  [string]$Day,

  # rebuild-checkpoint: replace an existing checkpoint (a copy of the old one is kept).
  [switch]$Force,

  # repair: where a local row and the database row differ, use the database row
  # (the local version is kept in data\repairs and recorded as a 'replaced' event).
  [switch]$PreferDatabase,

  # Testing aid: treat this UTC instant as "now" when deciding which days are complete.
  [string]$AsOfUtc
)

Set-StrictMode -Version 2
$ErrorActionPreference = 'Stop'

if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
  Write-Host ("analytics-backup needs PowerShell FullLanguage mode (current: {0}). Constrained Language Mode, used by AppLocker or WDAC policies, blocks the compiled CSV helper. Run it from an account or policy that allows FullLanguage." -f $ExecutionContext.SessionState.LanguageMode)
  exit 1
}

# ---------------------------------------------------------------------------
# Constants and paths
# ---------------------------------------------------------------------------
$script:CsvHeader = 'id,event_name,path,visitor_id,session_id,referrer,metadata,created_at_utc,created_at_wib'
$script:FieldSql = @(
  'id::text', 'event_name::text', 'path::text', 'visitor_id::text', 'session_id::text', 'referrer', 'metadata::text',
  "to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD""T""HH24:MI:SS.US""Z""')",
  "to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS.US')"
)
$script:SelectList = ($script:FieldSql[0..6] -join ', ') + ', ' + $script:FieldSql[7] + ' AS created_at_utc, ' + $script:FieldSql[8] + ' AS created_at_wib'
# Same text as the CSV fields, ordered by id. Every field is written as '<UTF-8 byte length>:<value>'
# (NULL as 'N'), so separator characters inside the data cannot make two different rows look alike.
$script:FingerprintSql = 'md5(string_agg(concat_ws(chr(31), ' + (($script:FieldSql | ForEach-Object { "coalesce(octet_length($_)::text || ':' || $_, 'N')" }) -join ', ') + '), chr(29) ORDER BY id))'
# A WIB day is archived only after this much time has passed since it ended.
$script:SettleMinutes = 15
$script:DefaultTaskName = 'Portfolio Analytics Backup'
$script:Utf8NoBom = New-Object System.Text.UTF8Encoding $false
$script:Secret = $null
$script:DayFilePattern = '^\d{4}-\d{2}-\d{2}\.csv$'
$script:TempFilePattern = '\.csv\.(source|new|partial|merge)$'

if (-not $StateDir) {
  $StateDir = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.analytics-backup'
}
$StateDir = [IO.Path]::GetFullPath($StateDir)
$script:Paths = @{
  Config        = Join-Path $StateDir 'config.json'
  Credential    = Join-Path $StateDir 'credential.dpapi'
  Checkpoint    = Join-Path $StateDir 'checkpoint.json'
  Data          = Join-Path $StateDir 'data'
  Events        = Join-Path $StateDir 'data\events'
  NullFile      = Join-Path $StateDir 'data\null-created-at.csv'
  Discrepancies = Join-Path $StateDir 'data\discrepancies'
  Repairs       = Join-Path $StateDir 'data\repairs'
  Logs          = Join-Path $StateDir 'logs'
  Tmp           = Join-Path $StateDir 'tmp'
}

# ---------------------------------------------------------------------------
# CSV records (exact text kept, NULL vs empty string distinguished)
# ---------------------------------------------------------------------------
$script:CsvHelperVersion = '3'
if (-not ([System.Management.Automation.PSTypeName]'AnalyticsBackupCsv').Type) {
  Add-Type -Language CSharp -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

public sealed class AnalyticsBackupRecord {
  public string Raw;
  public string[] Fields;
  public bool[] IsNull;
  public long Id;
  public string Utc = "";
  public string Wib = "";
  public bool SameContent(AnalyticsBackupRecord other) {
    if (other.Fields.Length != Fields.Length) return false;
    for (int i = 0; i < Fields.Length; i++) {
      if (IsNull[i] != other.IsNull[i] || !string.Equals(Fields[i], other.Fields[i], StringComparison.Ordinal)) return false;
    }
    return true;
  }
}

public static class AnalyticsBackupCsv {
  // Raise when this C# code changes: a PowerShell session that already loaded an
  // older copy must not keep using it.
  public const string Version = "3";

  // RFC 4180 as written by psql: unquoted empty field = NULL, "" = empty string.
  public static List<AnalyticsBackupRecord> Parse(string text) {
    var records = new List<AnalyticsBackupRecord>();
    int i = 0, n = text.Length;
    while (i < n) {
      int start = i;
      var fields = new List<string>();
      var nulls = new List<bool>();
      var sb = new StringBuilder();
      bool inQuotes = false, quoted = false;
      int end = -1;
      while (true) {
        if (i >= n) {
          if (inQuotes) throw new InvalidDataException("unterminated quoted field");
          end = n; break;
        }
        char c = text[i];
        if (inQuotes) {
          if (c == '"') {
            if (i + 1 < n && text[i + 1] == '"') { sb.Append('"'); i += 2; continue; }
            inQuotes = false; i++; continue;
          }
          sb.Append(c); i++; continue;
        }
        if (c == '"' && sb.Length == 0 && !quoted) { inQuotes = true; quoted = true; i++; continue; }
        if (c == ',') { fields.Add(sb.ToString()); nulls.Add(!quoted && sb.Length == 0); sb.Length = 0; quoted = false; i++; continue; }
        if (c == '\r' || c == '\n') {
          end = i;
          if (c == '\r' && i + 1 < n && text[i + 1] == '\n') i += 2; else i++;
          break;
        }
        if (quoted) throw new InvalidDataException("text after a closing quote");
        if (c == '"') throw new InvalidDataException("a quote inside an unquoted field");
        sb.Append(c); i++;
      }
      fields.Add(sb.ToString()); nulls.Add(!quoted && sb.Length == 0);
      records.Add(new AnalyticsBackupRecord { Raw = text.Substring(start, end - start), Fields = fields.ToArray(), IsNull = nulls.ToArray() });
    }
    return records;
  }

  public static List<AnalyticsBackupRecord> ReadFile(string path, string header) {
    byte[] bytes = File.ReadAllBytes(path);
    if (bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF) throw new InvalidDataException("file starts with a byte order mark");
    string text = new UTF8Encoding(false, true).GetString(bytes);
    var records = Parse(text);
    if (records.Count == 0 || records[0].Raw != header) throw new InvalidDataException("unexpected header");
    records.RemoveAt(0);
    foreach (var r in records) {
      if (r.Fields.Length != 9) throw new InvalidDataException("a record has " + r.Fields.Length + " fields instead of 9");
      long id;
      if (r.IsNull[0] || !long.TryParse(r.Fields[0], NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out id)) throw new InvalidDataException("invalid id '" + r.Fields[0] + "'");
      r.Id = id;
      r.Utc = r.IsNull[7] ? "" : r.Fields[7];
      r.Wib = r.IsNull[8] ? "" : r.Fields[8];
    }
    return records;
  }

  public static string Fingerprint(IEnumerable<AnalyticsBackupRecord> rows) {
    var list = new List<AnalyticsBackupRecord>(rows);
    if (list.Count == 0) return "";
    list.Sort((a, b) => a.Id.CompareTo(b.Id));
    var sb = new StringBuilder();
    for (int r = 0; r < list.Count; r++) {
      if (r > 0) sb.Append('\u001d');
      var x = list[r];
      for (int f = 0; f < x.Fields.Length; f++) {
        if (f > 0) sb.Append('\u001f');
        if (x.IsNull[f]) { sb.Append('N'); }
        else { sb.Append(Encoding.UTF8.GetByteCount(x.Fields[f]).ToString(CultureInfo.InvariantCulture)).Append(':').Append(x.Fields[f]); }
      }
    }
    using (var md5 = MD5.Create()) {
      var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
      var hex = new StringBuilder();
      foreach (var b in hash) hex.Append(b.ToString("x2"));
      return hex.ToString();
    }
  }

  // Ordinal order by created_at_utc, then id (culture-aware sorting could reorder ISO text).
  public static List<AnalyticsBackupRecord> SortForFile(IEnumerable<AnalyticsBackupRecord> rows) {
    var list = new List<AnalyticsBackupRecord>(rows);
    list.Sort((a, b) => { int c = string.CompareOrdinal(a.Utc, b.Utc); return c != 0 ? c : a.Id.CompareTo(b.Id); });
    return list;
  }

  public static void Write(string path, string header, IEnumerable<AnalyticsBackupRecord> rows) {
    var sb = new StringBuilder();
    sb.Append(header).Append('\n');
    foreach (var r in rows) sb.Append(r.Raw).Append('\n');
    File.WriteAllText(path, sb.ToString(), new UTF8Encoding(false));
  }
}
'@
}
$loadedVersion = $null
try { $loadedVersion = [string][AnalyticsBackupCsv]::Version } catch { }
if ($loadedVersion -ne $script:CsvHelperVersion) {
  Write-Host "This PowerShell session already holds a different copy of the CSV helper (version '$loadedVersion', expected '$($script:CsvHelperVersion)'). Open a new PowerShell window and run the command again."
  exit 1
}

# ---------------------------------------------------------------------------
# Logging (never logs the password, connection strings, or row contents)
# ---------------------------------------------------------------------------
function Protect-Text([string]$Text) {
  if ($null -eq $Text) { return '' }
  if ($script:Secret) { $Text = $Text.Replace($script:Secret, '********') }
  return ($Text -replace '(?i)(postgres(ql)?://)[^\s''"]+', '$1********')
}

function Write-Log([string]$Level, [string]$Message) {
  $line = '{0} [{1}] {2}' -f [DateTimeOffset]::Now.ToString('yyyy-MM-dd HH:mm:ss zzz'), $Level, (Protect-Text $Message)
  if (-not (Test-Path $script:Paths.Logs)) { New-Item -ItemType Directory -Force $script:Paths.Logs | Out-Null }
  $file = Join-Path $script:Paths.Logs ('backup-{0}.log' -f [DateTime]::Now.ToString('yyyy-MM'))
  [IO.File]::AppendAllText($file, $line + [Environment]::NewLine, $script:Utf8NoBom)
  Write-Host $line
}

function Get-ErrorText($ErrorRecord) {
  $exception = $ErrorRecord.Exception
  while ($exception.InnerException) { $exception = $exception.InnerException }
  return $exception.Message
}

# ---------------------------------------------------------------------------
# Configuration and credentials
# ---------------------------------------------------------------------------
function Get-BackupConfig {
  if (-not (Test-Path $script:Paths.Config)) {
    throw "Config not found: $($script:Paths.Config). Copy scripts\analytics-backup\config.example.json there (see docs/ANALYTICS-BACKUP.md)."
  }
  $raw = Get-Content -Raw -Encoding UTF8 $script:Paths.Config | ConvertFrom-Json
  $get = { param($name, $default) if ($raw.PSObject.Properties[$name] -and $null -ne $raw.$name -and "$($raw.$name)" -ne '') { $raw.$name } else { $default } }
  $config = @{
    Host     = [string](& $get 'host' '')
    Port     = [int](& $get 'port' 5432)
    Database = [string](& $get 'database' '')
    User     = [string](& $get 'user' '')
    SslMode  = [string](& $get 'sslMode' 'require')
    PsqlPath = [string](& $get 'psqlPath' '')
    TaskName = [string](& $get 'taskName' $script:DefaultTaskName)
  }
  foreach ($key in 'Host', 'Database', 'User') {
    if (-not $config[$key] -or $config[$key] -match '^<.*>$') { throw "config.json: '$($key.ToLower())' is not set." }
  }
  if ($config.Host -match '[/@?=\s]') { throw "config.json: 'host' must be a host name only, not a connection string." }
  if (@('require', 'verify-ca', 'verify-full', 'disable') -notcontains $config.SslMode) {
    throw "config.json: 'sslMode' must be require, verify-ca, verify-full, or disable."
  }
  if ($config.SslMode -eq 'disable' -and @('localhost', '127.0.0.1', '::1') -notcontains $config.Host) {
    throw "config.json: sslMode 'disable' is only allowed for a local test database."
  }
  return $config
}

function Get-BackupPassword {
  if (-not (Test-Path $script:Paths.Credential)) {
    throw "Credential not found. Run: analytics-backup.ps1 set-credential"
  }
  $secure = (Get-Content -Raw $script:Paths.Credential).Trim() | ConvertTo-SecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

function Resolve-Psql([string]$Configured) {
  $candidates = @()
  if ($Configured) { $candidates += $Configured }
  else {
    $candidates += Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
      Sort-Object { [int]($_.Directory.Parent.Name -replace '\D.*$', '') } -Descending |
      ForEach-Object { $_.FullName }
  }
  foreach ($path in $candidates) {
    if (-not (Test-Path $path)) { continue }
    $version = & $path --version 2>$null
    if ("$version" -match '\s(\d+)(\.\d+)?') {
      if ([int]$Matches[1] -ge 14) { return $path }
    }
  }
  throw "psql.exe 14 or newer was not found. Install the PostgreSQL command-line tools or set 'psqlPath' in config.json."
}

# ---------------------------------------------------------------------------
# psql runner: credentials only in the child process environment
# ---------------------------------------------------------------------------
function Invoke-Psql([hashtable]$Config, [string]$Sql) {
  if (-not (Test-Path $script:Paths.Tmp)) { New-Item -ItemType Directory -Force $script:Paths.Tmp | Out-Null }
  $file = Join-Path $script:Paths.Tmp ('q-' + [guid]::NewGuid().ToString('N') + '.sql')
  [IO.File]::WriteAllText($file, $Sql, $script:Utf8NoBom)
  try {
    $psi = New-Object Diagnostics.ProcessStartInfo
    $psi.FileName = $script:Psql
    $psi.Arguments = '-X -q -A -t -v ON_ERROR_STOP=1 -f "' + $file + '"'
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    $psi.StandardOutputEncoding = [Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
    foreach ($name in 'PGSERVICE', 'PGSERVICEFILE', 'PGOPTIONS', 'PGHOSTADDR', 'DATABASE_URL') {
      if ($psi.EnvironmentVariables.ContainsKey($name)) { $psi.EnvironmentVariables.Remove($name) }
    }
    $psi.EnvironmentVariables['PGHOST'] = $Config.Host
    $psi.EnvironmentVariables['PGPORT'] = [string]$Config.Port
    $psi.EnvironmentVariables['PGDATABASE'] = $Config.Database
    $psi.EnvironmentVariables['PGUSER'] = $Config.User
    $psi.EnvironmentVariables['PGPASSWORD'] = $script:Secret
    $psi.EnvironmentVariables['PGSSLMODE'] = $Config.SslMode
    $psi.EnvironmentVariables['PGCONNECT_TIMEOUT'] = '20'
    $psi.EnvironmentVariables['PGAPPNAME'] = 'portfolio-analytics-backup'
    $psi.EnvironmentVariables['PGCLIENTENCODING'] = 'UTF8'
    # Fixed session settings, whatever the server or role defaults are (dates are also formatted explicitly).
    $psi.EnvironmentVariables['PGDATESTYLE'] = 'ISO, MDY'
    $psi.EnvironmentVariables['PGTZ'] = 'UTC'
    $process = [Diagnostics.Process]::Start($psi)
    $stdout = $process.StandardOutput.ReadToEndAsync()
    $stderr = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit(900000)) { $process.Kill(); throw 'psql did not finish within 15 minutes.' }
    $process.WaitForExit()
    $lines = @($stdout.Result -split "`r?`n" | Where-Object { $_ -ne '' })
    if ($process.ExitCode -ne 0) {
      throw ('psql failed (exit {0}): {1}' -f $process.ExitCode, (Protect-Text $stderr.Result.Trim()))
    }
    return $lines
  }
  finally {
    Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
  }
}

function Get-Tagged([string[]]$Lines, [string]$Tag) {
  # The leading comma keeps a one-element result an array (PowerShell would unroll it to a string).
  return , @($Lines | Where-Object { $_.StartsWith($Tag + '|') } | ForEach-Object { $_.Substring($Tag.Length + 1) })
}

function Get-AsOfSql {
  if (-not $AsOfUtc) { return 'now()' }
  $parsed = [DateTimeOffset]::Parse($AsOfUtc, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeUniversal)
  return "TIMESTAMPTZ '" + $parsed.ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss.fff') + "+00'"
}

function ConvertTo-Date([string]$Text) { return [DateTime]::ParseExact($Text, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture) }
function ConvertTo-DayText([DateTime]$Date) { return $Date.ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture) }

function Get-WhereSql([string]$DayKey) {
  if ($DayKey -eq 'null') { return 'created_at IS NULL' }
  $next = ConvertTo-DayText ((ConvertTo-Date $DayKey).AddDays(1))
  return "created_at >= TIMESTAMP '$DayKey 00:00:00' AT TIME ZONE 'Asia/Jakarta' AND created_at < TIMESTAMP '$next 00:00:00' AT TIME ZONE 'Asia/Jakarta'"
}

function ConvertTo-SqlPath([string]$Path) { return $Path.Replace('\', '/').Replace("'", "''") }

# ---------------------------------------------------------------------------
# Preflight: role must be read-only; per-day fingerprints of the source
# ---------------------------------------------------------------------------
function Invoke-Preflight([hashtable]$Config, [switch]$WithFingerprints) {
  $asOf = Get-AsOfSql
  $endDate = "((($asOf) - interval '$($script:SettleMinutes) minutes') AT TIME ZONE 'Asia/Jakarta')::date"
  $fingerprints = ''
  if ($WithFingerprints) {
    $fingerprints = @"
SELECT 'FP|' || to_char(d, 'YYYY-MM-DD') || '|' || n || '|' || coalesce(h, '') FROM (
  SELECT (created_at AT TIME ZONE 'Asia/Jakarta')::date AS d, count(*) AS n, $($script:FingerprintSql) AS h
  FROM public.analytics_events
  WHERE created_at IS NOT NULL AND created_at < ($endDate)::timestamp AT TIME ZONE 'Asia/Jakarta'
  GROUP BY 1
) s ORDER BY d;
SELECT 'FPNULL|' || count(*) || '|' || coalesce($($script:FingerprintSql), '') FROM public.analytics_events WHERE created_at IS NULL;
"@
  }
  $sql = @"
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT 'ROLE|' || current_user || '|' || (rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls)::text
  FROM pg_roles WHERE rolname = current_user;
SELECT 'WRITE|' || count(*)
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p') AND n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg\_toast%'
    AND (has_table_privilege(c.oid, 'INSERT') OR has_table_privilege(c.oid, 'UPDATE')
      OR has_table_privilege(c.oid, 'DELETE') OR has_table_privilege(c.oid, 'TRUNCATE'));
SELECT 'CREATE|' || (has_database_privilege(current_database(), 'CREATE') OR has_schema_privilege('public', 'CREATE'))::text;
SELECT 'ELEVATED|' || coalesce((SELECT bool_or(pg_has_role(current_user, oid, 'MEMBER')) FROM pg_roles
  WHERE rolname IN ('neon_superuser', 'pg_write_all_data', 'pg_database_owner')), false)::text;
SELECT 'READ|' || has_table_privilege('public.analytics_events', 'SELECT')::text;
SELECT 'DAYS|' || to_char($endDate - 1, 'YYYY-MM-DD')
  || '|' || coalesce((SELECT to_char(min((created_at AT TIME ZONE 'Asia/Jakarta')::date), 'YYYY-MM-DD') FROM public.analytics_events WHERE created_at IS NOT NULL), '')
  || '|' || (SELECT count(*) FROM public.analytics_events WHERE created_at IS NULL);
$fingerprints
COMMIT;
"@
  $lines = Invoke-Psql $Config $sql
  $role = (Get-Tagged $lines 'ROLE')[0].Split('|')
  $days = (Get-Tagged $lines 'DAYS')[0].Split('|')
  $fp = @{}
  foreach ($line in (Get-Tagged $lines 'FP')) {
    $parts = $line.Split('|')
    $fp[$parts[0]] = @{ rows = [long]$parts[1]; md5 = $parts[2] }
  }
  $nullFp = @{ rows = [long]0; md5 = '' }
  $nullLine = Get-Tagged $lines 'FPNULL'
  if ($nullLine.Count -gt 0) { $parts = $nullLine[0].Split('|'); $nullFp = @{ rows = [long]$parts[0]; md5 = $parts[1] } }
  $result = @{
    User         = $role[0]
    RoleAttrs    = ($role[1] -eq 'true')
    WritableTabs = [int](Get-Tagged $lines 'WRITE')[0]
    CanCreate    = ((Get-Tagged $lines 'CREATE')[0] -eq 'true')
    Elevated     = ((Get-Tagged $lines 'ELEVATED')[0] -eq 'true')
    CanRead      = ((Get-Tagged $lines 'READ')[0] -eq 'true')
    LastComplete = $days[0]
    FirstDay     = $days[1]
    NullRows     = [long]$days[2]
    Fingerprints = $fp
    NullFp       = $nullFp
  }
  $problems = @()
  if ($result.RoleAttrs) { $problems += 'role has superuser/createrole/createdb/replication/bypassrls' }
  if ($result.Elevated) { $problems += 'role is a member of an elevated role (neon_superuser, pg_write_all_data, or pg_database_owner)' }
  if ($result.WritableTabs -gt 0) { $problems += "role can write to $($result.WritableTabs) table(s)" }
  if ($result.CanCreate) { $problems += 'role can create objects in the database or public schema' }
  $result.Problems = $problems
  return $result
}

# ---------------------------------------------------------------------------
# Checkpoint (version 2; atomic write, previous version kept as checkpoint.json.bak)
# ---------------------------------------------------------------------------
function New-Entry {
  return @{ rows = [long]0; minId = [long]0; maxId = [long]0; sha256 = ''; sourceRows = [long]0; sourceMd5 = ''; missingInSource = [long]0; conflicts = [long]0 }
}

function New-Checkpoint {
  return @{ version = 2; archivedThroughDate = $null; lastId = [long]0; days = @{}; nullCreatedAt = $null; updatedAtUtc = $null }
}

function ConvertTo-Entry($Raw) {
  $entry = New-Entry
  foreach ($key in @($entry.Keys)) {
    if (-not $Raw.PSObject.Properties[$key]) { throw "checkpoint.json: an entry is missing '$key'." }
    if ($key -in 'sha256', 'sourceMd5') { $entry[$key] = [string]$Raw.$key } else { $entry[$key] = [long]$Raw.$key }
  }
  return $entry
}

function Read-Checkpoint {
  if (-not (Test-Path $script:Paths.Checkpoint)) { return $null }
  try { $raw = Get-Content -Raw -Encoding UTF8 $script:Paths.Checkpoint | ConvertFrom-Json }
  catch { throw "checkpoint.json is not valid JSON. Run 'rebuild-checkpoint -Force' or restore checkpoint.json.bak (see docs/ANALYTICS-BACKUP.md)." }
  if (-not $raw -or -not $raw.PSObject.Properties['version'] -or $raw.version -ne 2) {
    throw "checkpoint.json has an unknown or older format. Run 'rebuild-checkpoint -Force' to recreate it from the archive."
  }
  $cp = New-Checkpoint
  if ($raw.archivedThroughDate) {
    if ($raw.archivedThroughDate -notmatch '^\d{4}-\d{2}-\d{2}$') { throw 'checkpoint.json: invalid archivedThroughDate.' }
    $cp.archivedThroughDate = [string]$raw.archivedThroughDate
  }
  $cp.lastId = [long]$raw.lastId
  if ($raw.PSObject.Properties['days'] -and $raw.days) {
    foreach ($property in $raw.days.PSObject.Properties) {
      if ($property.Name -notmatch '^\d{4}-\d{2}-\d{2}$') { throw "checkpoint.json: invalid day '$($property.Name)'." }
      $cp.days[$property.Name] = ConvertTo-Entry $property.Value
    }
  }
  if ($raw.PSObject.Properties['nullCreatedAt'] -and $raw.nullCreatedAt) { $cp.nullCreatedAt = ConvertTo-Entry $raw.nullCreatedAt }
  if ($raw.PSObject.Properties['updatedAtUtc']) { $cp.updatedAtUtc = [string]$raw.updatedAtUtc }
  return $cp
}

function ConvertTo-OrderedEntry($Entry) {
  return [ordered]@{
    rows = $Entry.rows; minId = $Entry.minId; maxId = $Entry.maxId; sha256 = $Entry.sha256
    sourceRows = $Entry.sourceRows; sourceMd5 = $Entry.sourceMd5; missingInSource = $Entry.missingInSource; conflicts = $Entry.conflicts
  }
}

function Save-Checkpoint($Checkpoint) {
  $Checkpoint.updatedAtUtc = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
  $days = [ordered]@{}
  foreach ($key in ($Checkpoint.days.Keys | Sort-Object)) { $days[$key] = ConvertTo-OrderedEntry $Checkpoint.days[$key] }
  $nullEntry = $null
  if ($Checkpoint.nullCreatedAt) { $nullEntry = ConvertTo-OrderedEntry $Checkpoint.nullCreatedAt }
  $doc = [ordered]@{
    version             = 2
    archivedThroughDate = $Checkpoint.archivedThroughDate
    lastId              = $Checkpoint.lastId
    updatedAtUtc        = $Checkpoint.updatedAtUtc
    nullCreatedAt       = $nullEntry
    days                = $days
  }
  $tmp = $script:Paths.Checkpoint + '.tmp'
  [IO.File]::WriteAllText($tmp, ($doc | ConvertTo-Json -Depth 6), $script:Utf8NoBom)
  Set-FileAtomically $tmp $script:Paths.Checkpoint
}

# ---------------------------------------------------------------------------
# Files
# ---------------------------------------------------------------------------
# Puts the finished file Source in place of Target. An existing target is kept as
# Target.bak and is never deleted before the new file is in place (ReplaceFile).
function Set-FileAtomically([string]$Source, [string]$Target) {
  if (Test-Path -LiteralPath $Target) {
    [IO.File]::Replace($Source, $Target, $Target + '.bak')
  }
  else {
    [IO.File]::Move($Source, $Target)
  }
}

function Get-ArchiveFile([string]$DayKey) {
  if ($DayKey -eq 'null') { return $script:Paths.NullFile }
  return Join-Path (Join-Path $script:Paths.Events $DayKey.Substring(0, 4)) ($DayKey + '.csv')
}

function Get-FileSha256([string]$Path) { return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant() }

function Read-Records([string]$Path) {
  return , [AnalyticsBackupCsv]::ReadFile($Path, $script:CsvHeader)
}

# Checks the records of one archive file; returns a description of the first problem, or $null.
function Test-Records($Records, [string]$DayKey) {
  $seen = New-Object 'System.Collections.Generic.HashSet[long]'
  foreach ($record in $Records) {
    if (-not $seen.Add($record.Id)) { return "duplicate id $($record.Id)" }
    if ($DayKey -eq 'null') {
      if ($record.Utc -ne '' -or $record.Wib -ne '') { return "id $($record.Id) has a created_at value in the NULL file" }
    }
    elseif (-not $record.Wib.StartsWith($DayKey + ' ')) { return "id $($record.Id) has a WIB date outside $DayKey" }
  }
  return $null
}

function Get-IdRange($Records) {
  if ($Records.Count -eq 0) { return @{ min = [long]0; max = [long]0 } }
  $min = [long]::MaxValue; $max = [long]::MinValue
  foreach ($record in $Records) { if ($record.Id -lt $min) { $min = $record.Id }; if ($record.Id -gt $max) { $max = $record.Id } }
  return @{ min = $min; max = $max }
}

function Get-DayKeys($Checkpoint) { return , @($Checkpoint.days.Keys | Sort-Object) }

function Get-Entry($Checkpoint, [string]$DayKey) {
  if ($DayKey -eq 'null') { return $Checkpoint.nullCreatedAt }
  return $Checkpoint.days[$DayKey]
}

# Archive files whose checkpoint checksum no longer matches (changed or missing).
function Get-DamagedKeys($Checkpoint) {
  $damaged = @()
  $keys = Get-DayKeys $Checkpoint
  if ($Checkpoint.nullCreatedAt) { $keys += 'null' }
  foreach ($key in $keys) {
    $file = Get-ArchiveFile $key
    if (-not (Test-Path -LiteralPath $file)) { $damaged += $key; continue }
    if ((Get-FileSha256 $file) -ne (Get-Entry $Checkpoint $key).sha256) { $damaged += $key }
  }
  return , $damaged
}

function Get-ArchiveFilesOnDisk {
  $files = @()
  if (Test-Path $script:Paths.Events) {
    $files += Get-ChildItem -LiteralPath $script:Paths.Events -Recurse -File | Where-Object { $_.Name -match $script:DayFilePattern }
  }
  return , $files
}

# True when every row of an unfinished .new file is already in the target archive file, unchanged.
function Test-NewFileCovered([string]$NewFile, [string]$Target) {
  if (-not (Test-Path -LiteralPath $Target)) { return $false }
  try { $newRows = Read-Records $NewFile; $targetRows = Read-Records $Target } catch { return $false }
  $byId = @{}
  foreach ($record in $targetRows) { $byId[$record.Id] = $record }
  foreach ($record in $newRows) {
    if (-not $byId.ContainsKey($record.Id) -or -not $byId[$record.Id].SameContent($record)) { return $false }
  }
  return $true
}

# Cleans up temporary files of an earlier run. Downloads (.source) and old-format temporary
# files are deleted. A .new file is deleted only when every row is already in the archive;
# otherwise it is moved to data\repairs\unfinished-<time>\ and 'repair' uses it.
function Remove-TempFiles {
  if (-not (Test-Path $script:Paths.Data)) { return }
  $stamp = [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
  $files = @(Get-ChildItem -LiteralPath $script:Paths.Data -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match $script:TempFilePattern -and $_.FullName -notmatch '\\repairs\\' })
  foreach ($file in $files) {
    if ($file.Name.EndsWith('.csv.new')) {
      $target = $file.FullName.Substring(0, $file.FullName.Length - 4)
      if (Test-NewFileCovered $file.FullName $target) {
        Remove-Item -LiteralPath $file.FullName -Force
        Write-Log 'INFO' "Removed unfinished file $($file.Name) from an earlier run (all its rows are in the archive)."
        continue
      }
      $dir = Join-Path $script:Paths.Repairs ('unfinished-' + $stamp)
      New-Item -ItemType Directory -Force $dir | Out-Null
      Move-Item -LiteralPath $file.FullName -Destination (Join-Path $dir $file.Name)
      Write-Log 'WARN' "Unfinished file $($file.Name) from an earlier run holds rows that are not in the archive file; it was kept in data\repairs\unfinished-$stamp and 'repair' will use it."
      continue
    }
    Remove-Item -LiteralPath $file.FullName -Force
    Write-Log 'INFO' "Removed unfinished file $($file.Name) from an earlier run."
  }
}

# Set-aside unfinished files for one archive file (see Remove-TempFiles).
function Get-UnfinishedFiles([string]$DayKey) {
  if (-not (Test-Path $script:Paths.Repairs)) { return , @() }
  $name = (Split-Path (Get-ArchiveFile $DayKey) -Leaf) + '.new'
  return , @(Get-ChildItem -LiteralPath $script:Paths.Repairs -Directory -Filter 'unfinished-*' |
    Sort-Object Name | ForEach-Object { Join-Path $_.FullName $name } | Where-Object { Test-Path -LiteralPath $_ })
}

# ---------------------------------------------------------------------------
# Discrepancy history: one append-only JSON Lines log per archive file.
#   missing   archived row the database no longer returns (archived version kept)
#   conflict  same id, different content (archived version kept; source version recorded)
#   resolved  the database matches the archive again for an id that had an open discrepancy
#   replaced  'repair -PreferDatabase' replaced the local version (archived) with the database version (source)
# An event is written only when the state of an id changes, so re-runs add nothing.
# Existing lines are never rewritten; a log that cannot be read is moved aside unchanged.
# ---------------------------------------------------------------------------
$script:Attention = New-Object System.Collections.Generic.List[string]
$script:DiscrepancyKinds = @('missing', 'conflict', 'resolved', 'replaced')

function Get-DiscrepancyLog([string]$DayKey) {
  $name = if ($DayKey -eq 'null') { 'null-created-at.jsonl' } else { "$DayKey.jsonl" }
  return Join-Path $script:Paths.Discrepancies $name
}

# Returns @{ Text; Events } or throws with the reason the log is not valid.
function Read-DiscrepancyLog([string]$Path) {
  $bytes = [IO.File]::ReadAllBytes($Path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { throw 'file starts with a byte order mark' }
  try { $text = (New-Object System.Text.UTF8Encoding($false, $true)).GetString($bytes) } catch { throw 'file is not valid UTF-8' }
  if ($text.Length -gt 0 -and -not $text.EndsWith("`n")) { throw 'the last line is incomplete' }
  $events = New-Object System.Collections.Generic.List[object]
  $number = 0
  foreach ($line in ($text -split "`n")) {
    if ($line -eq '') { continue }
    $number++
    try { $event = $line | ConvertFrom-Json } catch { throw "line $number is not valid JSON" }
    foreach ($field in 'detectedAtUtc', 'file', 'id', 'kind', 'archived', 'source') {
      if (-not $event.PSObject.Properties[$field]) { throw "line $number has no '$field'" }
    }
    if ($script:DiscrepancyKinds -notcontains $event.kind) { throw "line $number has an unknown kind '$($event.kind)'" }
    $events.Add($event)
  }
  return @{ Text = $text; Events = $events }
}

function New-DiscrepancyLine([string]$Now, [string]$DayKey, [long]$Id, [string]$Kind, $Archived, $Source) {
  $event = [ordered]@{ detectedAtUtc = $Now; file = $DayKey; id = $Id; kind = $Kind; archived = $Archived; source = $Source }
  return (ConvertTo-Json -InputObject $event -Compress)
}

function Write-DiscrepancyEvents([string]$DayKey, $Merge, $Replaced = @()) {
  $path = Get-DiscrepancyLog $DayKey
  $text = ''
  $events = @()
  if (Test-Path -LiteralPath $path) {
    try { $log = Read-DiscrepancyLog $path; $text = $log.Text; $events = $log.Events }
    catch {
      $reason = Get-ErrorText $_
      $dir = Join-Path $script:Paths.Discrepancies ('corrupt-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss'))
      New-Item -ItemType Directory -Force $dir | Out-Null
      Move-Item -LiteralPath $path -Destination (Join-Path $dir (Split-Path $path -Leaf))
      Write-Log 'ERROR' "Discrepancy log $(Split-Path $path -Leaf) is not valid ($reason). It was moved unchanged to data\discrepancies\$(Split-Path $dir -Leaf) for review; a new log was started."
      $script:Attention.Add("discrepancy log $DayKey")
    }
  }
  $last = @{}
  foreach ($event in $events) { $last[[long]$event.id] = $event }
  $now = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
  $lines = New-Object System.Collections.Generic.List[string]
  $open = @{}
  foreach ($change in $Replaced) {
    $lines.Add((New-DiscrepancyLine $now $DayKey $change.id 'replaced' $change.archived $change.source))
    $last[[long]$change.id] = [pscustomobject]@{ kind = 'replaced'; source = $change.source }
  }
  foreach ($record in $Merge.MissingRecords) {
    $open[$record.Id] = $true
    $previous = $last[$record.Id]
    if (-not $previous -or $previous.kind -ne 'missing') { $lines.Add((New-DiscrepancyLine $now $DayKey $record.Id 'missing' $record.Raw $null)) }
  }
  foreach ($conflict in $Merge.Conflicts) {
    $open[[long]$conflict.id] = $true
    $previous = $last[[long]$conflict.id]
    if (-not $previous -or $previous.kind -ne 'conflict' -or $previous.source -cne $conflict.source) {
      $lines.Add((New-DiscrepancyLine $now $DayKey $conflict.id 'conflict' $conflict.archived $conflict.source))
    }
  }
  foreach ($id in @($last.Keys | Sort-Object)) {
    if (@('resolved', 'replaced') -notcontains $last[$id].kind -and -not $open.ContainsKey($id)) {
      $archived = $null; if ($Merge.ArchiveById.ContainsKey($id)) { $archived = $Merge.ArchiveById[$id].Raw }
      $lines.Add((New-DiscrepancyLine $now $DayKey $id 'resolved' $archived $null))
    }
  }
  if ($lines.Count -eq 0) { return }
  if (-not (Test-Path $script:Paths.Discrepancies)) { New-Item -ItemType Directory -Force $script:Paths.Discrepancies | Out-Null }
  $newText = $text + (($lines | ForEach-Object { $_ + "`n" }) -join '')
  $tmp = $path + '.tmp'
  [IO.File]::WriteAllText($tmp, $newText, $script:Utf8NoBom)
  $check = Read-DiscrepancyLog $tmp
  if (-not $check.Text.StartsWith($text, [StringComparison]::Ordinal) -or $check.Events.Count -ne ($events.Count + $lines.Count)) {
    throw "validation of the discrepancy log for $DayKey failed; the existing log was not changed"
  }
  Set-FileAtomically $tmp $path
}

# ---------------------------------------------------------------------------
# Synchronise one archive file with the database (merge-only)
# ---------------------------------------------------------------------------
function Get-SourceRecords([hashtable]$Config, [string]$DayKey) {
  $target = Get-ArchiveFile $DayKey
  $folder = Split-Path $target -Parent
  if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Force $folder | Out-Null }
  $temp = $target + '.source'
  $where = Get-WhereSql $DayKey
  $sql = "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;`n" +
    "\copy (SELECT $($script:SelectList) FROM public.analytics_events WHERE $where ORDER BY id) TO '$(ConvertTo-SqlPath $temp)' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')`n" +
    "SELECT 'STATS|' || count(*) || '|' || coalesce(sum(id), 0) || '|' || coalesce($($script:FingerprintSql), '') FROM public.analytics_events WHERE $where;`n" +
    "COMMIT;`n"
  $stats = (Get-Tagged (Invoke-Psql $Config $sql) 'STATS')[0].Split('|')
  $records = Read-Records $temp
  $sum = [decimal]0; foreach ($record in $records) { $sum += $record.Id }
  if ($records.Count -ne [long]$stats[0]) { throw "download for $DayKey has $($records.Count) rows, the database reports $($stats[0])" }
  if ($sum -ne [decimal]$stats[1]) { throw "download for $DayKey : id checksum differs from the database" }
  if ([AnalyticsBackupCsv]::Fingerprint($records) -ne $stats[2]) { throw "download for $DayKey : content fingerprint differs from the database" }
  $problem = Test-Records $records $DayKey
  if ($problem) { throw "download for $DayKey : $problem" }
  Remove-Item -LiteralPath $temp -Force
  return @{ Records = $records; Md5 = $stats[2] }
}

# Merges source rows into archive rows. Archived rows always win; nothing is removed.
function Merge-Records($Archive, $Source) {
  $byId = @{}
  foreach ($record in $Archive) { $byId[$record.Id] = $record }
  $added = New-Object System.Collections.Generic.List[AnalyticsBackupRecord]
  $conflicts = @()
  $sourceIds = New-Object 'System.Collections.Generic.HashSet[long]'
  foreach ($record in $Source) {
    [void]$sourceIds.Add($record.Id)
    if (-not $byId.ContainsKey($record.Id)) { $added.Add($record); continue }
    if (-not $byId[$record.Id].SameContent($record)) {
      $conflicts += [ordered]@{ id = $record.Id; archived = $byId[$record.Id].Raw; source = $record.Raw }
    }
  }
  $missingRecords = @($Archive | Where-Object { -not $sourceIds.Contains($_.Id) })
  $missing = @($missingRecords | ForEach-Object { $_.Id })
  return @{ Added = $added; Conflicts = $conflicts; Missing = $missing; MissingRecords = $missingRecords; ArchiveById = $byId }
}

# Writes the records through a validated temporary file and an atomic replace.
# MustContain lists ids already archived: the new file is rejected if any is missing.
function Write-ArchiveFile([string]$DayKey, $Records, $MustContain) {
  $target = Get-ArchiveFile $DayKey
  $folder = Split-Path $target -Parent
  if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Force $folder | Out-Null }
  $temp = $target + '.new'
  $sorted = [AnalyticsBackupCsv]::SortForFile([AnalyticsBackupRecord[]]@($Records))
  [AnalyticsBackupCsv]::Write($temp, $script:CsvHeader, $sorted)
  $check = Read-Records $temp
  if ($check.Count -ne $sorted.Count) { throw "validation of the new $DayKey file failed: row count" }
  $problem = Test-Records $check $DayKey
  if ($problem) { throw "validation of the new $DayKey file failed: $problem" }
  $ids = New-Object 'System.Collections.Generic.HashSet[long]'
  foreach ($record in $check) { [void]$ids.Add($record.Id) }
  foreach ($id in $MustContain) { if (-not $ids.Contains([long]$id)) { throw "validation of the new $DayKey file failed: archived id $id would be lost" } }
  if ($env:ANALYTICS_BACKUP_TEST_FAIL_BEFORE_COMMIT -eq $DayKey) { throw "Test hook: simulated failure before replacing $DayKey." }
  Set-FileAtomically $temp $target
  return , $check
}

function New-ArchiveEntry([string]$DayKey, $Final, $Source, $Merge) {
  $range = Get-IdRange $Final
  $entry = New-Entry
  $entry.rows = [long]$Final.Count; $entry.minId = $range.min; $entry.maxId = $range.max
  $entry.sha256 = Get-FileSha256 (Get-ArchiveFile $DayKey)
  $entry.sourceRows = [long]$Source.Records.Count; $entry.sourceMd5 = $Source.Md5
  $entry.missingInSource = [long]$Merge.Missing.Count; $entry.conflicts = [long]$Merge.Conflicts.Count
  return $entry
}

function Write-MergeWarnings([string]$DayKey, [long]$ArchiveRows, $Source, $Merge) {
  if ($Source.Records.Count -lt $ArchiveRows) {
    Write-Log 'WARN' "The database now returns $($Source.Records.Count) row(s) for $DayKey but the archive holds $ArchiveRows; the archive was kept."
  }
  if ($Merge.Missing.Count -gt 0) { Write-Log 'WARN' "$($Merge.Missing.Count) archived row(s) of $DayKey are no longer in the database; see data\discrepancies." }
  if ($Merge.Conflicts.Count -gt 0) { Write-Log 'WARN' "$($Merge.Conflicts.Count) row(s) of $DayKey differ between the database and the archive; archived versions kept, see data\discrepancies." }
}

function Sync-ArchiveFile([hashtable]$Config, [string]$DayKey) {
  $target = Get-ArchiveFile $DayKey
  $source = Get-SourceRecords $Config $DayKey
  $archive = New-Object System.Collections.Generic.List[AnalyticsBackupRecord]
  $exists = Test-Path -LiteralPath $target
  if ($exists) { foreach ($record in (Read-Records $target)) { $archive.Add($record) } }
  $merge = Merge-Records $archive $source.Records
  $final = $archive
  if (-not $exists -or $merge.Added.Count -gt 0) {
    $all = New-Object System.Collections.Generic.List[AnalyticsBackupRecord]
    foreach ($record in $archive) { $all.Add($record) }
    foreach ($record in $merge.Added) { $all.Add($record) }
    $final = Write-ArchiveFile $DayKey $all @($archive | ForEach-Object { $_.Id })
    if ($exists) { Write-Log 'INFO' "Added $($merge.Added.Count) new row(s) to archived $DayKey (previous file kept as .bak)." }
  }
  Write-MergeWarnings $DayKey $final.Count $source $merge
  Write-DiscrepancyEvents $DayKey $merge
  return @{ Entry = (New-ArchiveEntry $DayKey $final $source $merge); Added = $merge.Added.Count }
}

function Set-Entry($Checkpoint, [string]$DayKey, $Entry) {
  if ($DayKey -eq 'null') { $Checkpoint.nullCreatedAt = $Entry; return }
  $Checkpoint.days[$DayKey] = $Entry
  if ($Entry.maxId -gt $Checkpoint.lastId) { $Checkpoint.lastId = $Entry.maxId }
}

# archivedThroughDate = last day of the unbroken run of archived days.
function Update-Through($Checkpoint) {
  $keys = Get-DayKeys $Checkpoint
  if ($keys.Count -eq 0) { $Checkpoint.archivedThroughDate = $null; return }
  $day = ConvertTo-Date $keys[0]
  while ($Checkpoint.days.ContainsKey((ConvertTo-DayText $day.AddDays(1)))) { $day = $day.AddDays(1) }
  $Checkpoint.archivedThroughDate = ConvertTo-DayText $day
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
function Initialize-Connection {
  $config = Get-BackupConfig
  $script:Secret = Get-BackupPassword
  $script:Psql = Resolve-Psql $config.PsqlPath
  return $config
}

function Assert-ReadOnly($Pre) {
  if (-not $Pre.CanRead) { Write-Log 'ERROR' 'The role cannot read public.analytics_events.'; return 1 }
  if ($Pre.Problems.Count -gt 0) {
    Write-Log 'ERROR' ('Refusing to run with a role that is not read-only: ' + ($Pre.Problems -join '; ') + '. Use the analytics_backup role from docs/ANALYTICS-BACKUP.md.')
    return 2
  }
  return 0
}

function Test-ArchivePresent { return ((Get-ArchiveFilesOnDisk).Count -gt 0 -or (Test-Path $script:Paths.NullFile)) }

# A replacement that finished on disk but stopped before the checkpoint was saved leaves:
# the checkpoint checksum equal to the .bak file, and a valid current file that still
# holds every .bak row unchanged. Returns @{ Records } in that case, otherwise $null.
function Test-InterruptedReplace($Checkpoint, [string]$DayKey) {
  $entry = Get-Entry $Checkpoint $DayKey
  $file = Get-ArchiveFile $DayKey
  $bak = $file + '.bak'
  if (-not $entry -or -not (Test-Path -LiteralPath $file) -or -not (Test-Path -LiteralPath $bak)) { return $null }
  if ((Get-FileSha256 $bak) -ne $entry.sha256) { return $null }
  try { $current = Read-Records $file; $previous = Read-Records $bak } catch { return $null }
  if (Test-Records $current $DayKey) { return $null }
  $byId = @{}
  foreach ($record in $current) { $byId[$record.Id] = $record }
  foreach ($record in $previous) {
    if (-not $byId.ContainsKey($record.Id) -or -not $byId[$record.Id].SameContent($record)) { return $null }
  }
  return @{ Records = $current }
}

function Invoke-Run {
  $config = Initialize-Connection
  Write-Log 'INFO' "Backup started (database '$($config.Database)', user '$($config.User)')."
  $checkpoint = Read-Checkpoint
  if (-not $checkpoint -and (Test-ArchivePresent)) {
    Write-Log 'ERROR' "checkpoint.json is missing but archive files exist. Run 'rebuild-checkpoint' first; nothing was changed."
    return 1
  }
  $pre = Invoke-Preflight $config -WithFingerprints
  $code = Assert-ReadOnly $pre
  if ($code -ne 0) { return $code }
  foreach ($dir in $script:Paths.Data, $script:Paths.Events, $script:Paths.Tmp) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  }
  if (-not $checkpoint) { $checkpoint = New-Checkpoint }
  Remove-TempFiles

  $damaged = @()
  foreach ($key in (Get-DamagedKeys $checkpoint)) {
    $finished = Test-InterruptedReplace $checkpoint $key
    if ($finished) {
      # Keep the recorded source fingerprint: the day is compared with the database again below.
      $entry = Get-Entry $checkpoint $key
      $range = Get-IdRange $finished.Records
      $entry.rows = [long]$finished.Records.Count; $entry.minId = $range.min; $entry.maxId = $range.max
      $entry.sha256 = Get-FileSha256 (Get-ArchiveFile $key)
      Set-Entry $checkpoint $key $entry
      Save-Checkpoint $checkpoint
      Write-Log 'WARN' "Archive file for $key was replaced by an earlier run that stopped before saving the checkpoint; the new file holds every earlier row unchanged and was accepted."
      continue
    }
    $damaged += $key
    Write-Log 'ERROR' "Archive file for $key is missing or changed since it was written. It was NOT overwritten. Run 'verify', then 'repair -Day $key' (see docs/ANALYTICS-BACKUP.md)."
  }

  # Every day from the first known day to the last complete day whose fingerprint changed.
  $todo = New-Object 'System.Collections.Generic.SortedSet[string]'
  $starts = @()
  if ($pre.FirstDay) { $starts += $pre.FirstDay }
  $keys = Get-DayKeys $checkpoint
  if ($keys.Count -gt 0) { $starts += $keys[0] }
  if ($starts.Count -gt 0) {
    $start = ConvertTo-Date ($starts | Sort-Object | Select-Object -First 1)
    $end = ConvertTo-Date $pre.LastComplete
    for ($d = $start; $d -le $end; $d = $d.AddDays(1)) {
      $key = ConvertTo-DayText $d
      if ($damaged -contains $key) { continue }
      $sourceMd5 = ''
      if ($pre.Fingerprints.ContainsKey($key)) { $sourceMd5 = $pre.Fingerprints[$key].md5 }
      if (-not $checkpoint.days.ContainsKey($key) -or $checkpoint.days[$key].sourceMd5 -ne $sourceMd5) { [void]$todo.Add($key) }
    }
  }
  $nullChanged = $false
  if ($checkpoint.nullCreatedAt) { $nullChanged = ($checkpoint.nullCreatedAt.sourceMd5 -ne $pre.NullFp.md5) }
  else { $nullChanged = ($pre.NullFp.rows -gt 0) }
  if ($damaged -contains 'null') { $nullChanged = $false }

  if ($todo.Count -eq 0 -and -not $nullChanged) { Write-Log 'INFO' "Archive is up to date (last complete WIB day: $($pre.LastComplete))." }
  foreach ($key in $todo) {
    $isNew = -not $checkpoint.days.ContainsKey($key)
    $result = Sync-ArchiveFile $config $key
    Set-Entry $checkpoint $key $result.Entry
    Update-Through $checkpoint
    Save-Checkpoint $checkpoint
    if ($isNew) { Write-Log 'INFO' "Archived $key : $($result.Entry.rows) row(s)." }
  }
  if ($nullChanged) {
    $result = Sync-ArchiveFile $config 'null'
    Set-Entry $checkpoint 'null' $result.Entry
    Save-Checkpoint $checkpoint
    if ($result.Entry.rows -gt 0) { Write-Log 'WARN' "$($result.Entry.rows) row(s) with NULL created_at are kept in data\null-created-at.csv." }
  }
  Write-Log 'INFO' "Backup finished: $($todo.Count) day(s) synchronised; archived through $($checkpoint.archivedThroughDate)."
  $attention = @($damaged) + @($script:Attention)
  if ($attention.Count -gt 0) { Write-Log 'ERROR' "$($attention.Count) item(s) need attention: $($attention -join ', ')."; return 4 }
  return 0
}

function Invoke-Check {
  $config = Initialize-Connection
  $pre = Invoke-Preflight $config
  Write-Log 'INFO' "Connection check as '$($pre.User)': can read analytics_events = $($pre.CanRead); earliest day = $($pre.FirstDay); last complete WIB day = $($pre.LastComplete); NULL created_at rows = $($pre.NullRows)."
  $code = Assert-ReadOnly $pre
  if ($code -eq 0) { Write-Log 'INFO' 'Role is read-only. Ready to back up.' }
  return $code
}

# Validates one archive file; returns @{ Records; Error }.
function Test-ArchiveFile([string]$DayKey) {
  $file = Get-ArchiveFile $DayKey
  if (-not (Test-Path -LiteralPath $file)) { return @{ Records = $null; Error = 'file missing' } }
  try { $records = Read-Records $file } catch { return @{ Records = $null; Error = (Get-ErrorText $_) } }
  return @{ Records = $records; Error = (Test-Records $records $DayKey) }
}

function Invoke-Verify {
  $checkpoint = Read-Checkpoint
  if (-not $checkpoint) {
    if (Test-ArchivePresent) { Write-Host "FAIL checkpoint.json is missing but archive files exist; run rebuild-checkpoint."; return 1 }
    Write-Host 'No checkpoint yet; nothing to verify.'; return 0
  }
  $bad = 0
  $keys = Get-DayKeys $checkpoint
  if ($checkpoint.nullCreatedAt) { $keys += 'null' }
  foreach ($key in $keys) {
    $entry = Get-Entry $checkpoint $key
    $result = Test-ArchiveFile $key
    $reason = $result.Error
    if (-not $reason) {
      if ((Get-FileSha256 (Get-ArchiveFile $key)) -ne $entry.sha256) {
        if (Test-InterruptedReplace $checkpoint $key) { Write-Host "NOTE $key : replacement finished but the checkpoint was not saved; the next run accepts it."; continue }
        $reason = 'SHA-256 differs from checkpoint'
      }
      elseif ($result.Records.Count -ne $entry.rows) { $reason = 'row count differs from checkpoint' }
    }
    if ($reason) { $bad++; Write-Host "FAIL $key : $reason" }
  }
  if (Test-Path $script:Paths.Discrepancies) {
    foreach ($log in (Get-ChildItem -LiteralPath $script:Paths.Discrepancies -Filter '*.jsonl' -File)) {
      try { Read-DiscrepancyLog $log.FullName | Out-Null }
      catch { $bad++; Write-Host "FAIL discrepancies\$($log.Name) : $(Get-ErrorText $_)" }
    }
    $set = @(Get-ChildItem -LiteralPath $script:Paths.Discrepancies -Directory -Filter 'corrupt-*')
    if ($set.Count -gt 0) { Write-Host "NOTE $($set.Count) folder(s) with set-aside discrepancy logs in data\discrepancies (corrupt-*); review them manually." }
  }
  $dayKeys = Get-DayKeys $checkpoint
  if ($dayKeys.Count -gt 0) {
    for ($d = ConvertTo-Date $dayKeys[0]; $d -le (ConvertTo-Date $dayKeys[-1]); $d = $d.AddDays(1)) {
      if (-not $checkpoint.days.ContainsKey((ConvertTo-DayText $d))) { $bad++; Write-Host "FAIL $(ConvertTo-DayText $d) : day missing from checkpoint" }
    }
  }
  foreach ($file in (Get-ArchiveFilesOnDisk)) {
    if (-not $checkpoint.days.ContainsKey($file.BaseName)) { $bad++; Write-Host "FAIL $($file.BaseName) : file exists on disk but not in checkpoint" }
  }
  $withDiscrepancies = @($checkpoint.days.Values | Where-Object { $_.missingInSource -gt 0 -or $_.conflicts -gt 0 }).Count
  Write-Host ("Verified {0} archive file(s); problems: {1}; days with database discrepancies: {2}." -f $keys.Count, $bad, $withDiscrepancies)
  if ($bad -gt 0) { return 1 } else { return 0 }
}

function New-LocalEntry($Records, [string]$Path) {
  $entry = New-Entry
  $range = Get-IdRange $Records
  $entry.rows = [long]$Records.Count; $entry.minId = $range.min; $entry.maxId = $range.max
  $entry.sha256 = Get-FileSha256 $Path
  # The database state is unknown: start from the archive's own fingerprint; the next run compares it with the database.
  $entry.sourceRows = $entry.rows; $entry.sourceMd5 = [AnalyticsBackupCsv]::Fingerprint($Records)
  return $entry
}

function Invoke-RebuildCheckpoint {
  if ((Test-Path $script:Paths.Checkpoint) -and -not $Force) {
    Write-Host "checkpoint.json already exists. Use 'rebuild-checkpoint -Force' to replace it (a copy is kept)."
    return 1
  }
  $problems = @()
  $checkpoint = New-Checkpoint
  foreach ($file in ((Get-ArchiveFilesOnDisk) | Sort-Object Name)) {
    $key = $file.BaseName
    $expected = Get-ArchiveFile $key
    if ($file.FullName -ne $expected) { $problems += "$($file.FullName): not in the expected folder ($expected)"; continue }
    $result = Test-ArchiveFile $key
    if ($result.Error) { $problems += "${key}: $($result.Error)"; continue }
    Set-Entry $checkpoint $key (New-LocalEntry $result.Records $file.FullName)
  }
  if (Test-Path $script:Paths.NullFile) {
    $result = Test-ArchiveFile 'null'
    if ($result.Error) { $problems += "null-created-at.csv: $($result.Error)" }
    else { Set-Entry $checkpoint 'null' (New-LocalEntry $result.Records $script:Paths.NullFile) }
  }
  $keys = Get-DayKeys $checkpoint
  if ($keys.Count -gt 0) {
    for ($d = ConvertTo-Date $keys[0]; $d -le (ConvertTo-Date $keys[-1]); $d = $d.AddDays(1)) {
      if (-not $checkpoint.days.ContainsKey((ConvertTo-DayText $d))) { $problems += "$(ConvertTo-DayText $d): file missing between the first and last archived day" }
    }
  }
  if ($problems.Count -gt 0) {
    Write-Log 'ERROR' ('rebuild-checkpoint stopped; no checkpoint was written. Problems: ' + ($problems -join ' | '))
    Write-Host 'Manual action: restore the listed files from your copy of the archive (same folder layout), or move damaged files out of data\events and keep them for review, then run rebuild-checkpoint again. See docs/ANALYTICS-BACKUP.md section 7.'
    return 1
  }
  if ($keys.Count -eq 0 -and -not $checkpoint.nullCreatedAt) { Write-Host 'No archive files found; nothing to rebuild.'; return 1 }
  Update-Through $checkpoint
  if (Test-Path $script:Paths.Checkpoint) {
    $copy = $script:Paths.Checkpoint + '.before-rebuild-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
    Copy-Item -LiteralPath $script:Paths.Checkpoint -Destination $copy
    Write-Log 'INFO' "Previous checkpoint kept as $(Split-Path $copy -Leaf)."
  }
  Save-Checkpoint $checkpoint
  Write-Log 'INFO' "Checkpoint rebuilt from $($keys.Count) day file(s); archived through $($checkpoint.archivedThroughDate). No database was contacted."
  return 0
}

function Invoke-Repair {
  if (-not $Day) { Write-Host 'Specify -Day yyyy-MM-dd, -Day null, or -Day all.'; return 1 }
  $checkpoint = Read-Checkpoint
  if (-not $checkpoint) { Write-Host "No checkpoint. Run 'rebuild-checkpoint' first."; return 1 }
  $damaged = Get-DamagedKeys $checkpoint
  if ($Day -eq 'all') { $keys = $damaged }
  elseif ($Day -eq 'null' -or $Day -match '^\d{4}-\d{2}-\d{2}$') { $keys = @($Day) }
  else { Write-Host 'Invalid -Day value.'; return 1 }
  if ($keys.Count -eq 0) { Write-Host 'Nothing to repair.'; return 0 }
  $config = Initialize-Connection
  $pre = Invoke-Preflight $config
  $code = Assert-ReadOnly $pre
  if ($code -ne 0) { return $code }
  Remove-TempFiles
  $stamp = [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
  $saveDir = Join-Path $script:Paths.Repairs $stamp
  foreach ($key in $keys) {
    $target = Get-ArchiveFile $key
    New-Item -ItemType Directory -Force $saveDir | Out-Null
    # 1. Keep copies of every existing version before changing anything.
    $candidates = New-Object System.Collections.Generic.List[AnalyticsBackupRecord]
    $dropped = 0
    $index = 0
    foreach ($path in (@(($target + '.bak'), $target) + (Get-UnfinishedFiles $key))) {
      if (-not (Test-Path -LiteralPath $path)) { continue }
      $index++
      Copy-Item -LiteralPath $path -Destination (Join-Path $saveDir ('{0}-{1}' -f $index, (Split-Path $path -Leaf)))
      try { $records = Read-Records $path }
      catch { Write-Log 'WARN' "$(Split-Path $path -Leaf) could not be read as CSV ($(Get-ErrorText $_)); it is kept in data\repairs\$stamp for manual review."; continue }
      foreach ($record in $records) {
        $ok = if ($key -eq 'null') { $record.Utc -eq '' } else { $record.Wib.StartsWith($key + ' ') }
        if ($ok) { $candidates.Add($record) } else { $dropped++ }
      }
    }
    if ($dropped -gt 0) { Write-Log 'WARN' "$dropped row(s) in the local $key files did not belong to that file; they remain in data\repairs\$stamp only." }
    # 2. One version per id: .bak (written by this tool) first, then the current file,
    #    then unfinished files set aside by an earlier run.
    $archive = New-Object System.Collections.Generic.List[AnalyticsBackupRecord]
    $seen = @{}
    $localConflicts = 0
    foreach ($record in $candidates) {
      if ($seen.ContainsKey($record.Id)) { if (-not $seen[$record.Id].SameContent($record)) { $localConflicts++ }; continue }
      $seen[$record.Id] = $record; $archive.Add($record)
    }
    if ($localConflicts -gt 0) { Write-Log 'WARN' "$localConflicts id(s) of $key had different content in the current file and its .bak; the .bak version was kept. Both are in data\repairs\$stamp." }
    # 3. Merge with the database (archived rows win) and write atomically.
    $source = Get-SourceRecords $config $key
    $replaced = @()
    if ($PreferDatabase) {
      $sourceById = @{}
      foreach ($record in $source.Records) { $sourceById[$record.Id] = $record }
      for ($i = 0; $i -lt $archive.Count; $i++) {
        $local = $archive[$i]
        if ($sourceById.ContainsKey($local.Id) -and -not $sourceById[$local.Id].SameContent($local)) {
          $replaced += [ordered]@{ id = $local.Id; archived = $local.Raw; source = $sourceById[$local.Id].Raw }
          $archive[$i] = $sourceById[$local.Id]
        }
      }
      if ($replaced.Count -gt 0) { Write-Log 'WARN' "$($replaced.Count) row(s) of $key took the database version (-PreferDatabase); the local versions are in data\repairs\$stamp and in the discrepancy log." }
    }
    $merge = Merge-Records $archive $source.Records
    $all = New-Object System.Collections.Generic.List[AnalyticsBackupRecord]
    foreach ($record in $archive) { $all.Add($record) }
    foreach ($record in $merge.Added) { $all.Add($record) }
    $final = Write-ArchiveFile $key $all @($archive | ForEach-Object { $_.Id })
    Write-MergeWarnings $key $final.Count $source $merge
    Write-DiscrepancyEvents $key $merge $replaced
    Set-Entry $checkpoint $key (New-ArchiveEntry $key $final $source $merge)
    Update-Through $checkpoint
    Save-Checkpoint $checkpoint
    Write-Log 'INFO' "Repaired $key : $($final.Count) row(s) ($($archive.Count) from local files, $($merge.Added.Count) from the database). Earlier files saved in data\repairs\$stamp."
  }
  return 0
}

function Get-TaskName {
  try { return (Get-BackupConfig).TaskName } catch { return $script:DefaultTaskName }
}

# ---------------------------------------------------------------------------
# Task Scheduler access. Every call goes through these functions. When the
# test-only variable ANALYTICS_BACKUP_TEST_TASK_STORE names a JSON file, they
# read and write that file instead, so tests never touch the real Task Scheduler.
# ---------------------------------------------------------------------------
function Read-FakeTasks {
  $store = @{}
  if (Test-Path $env:ANALYTICS_BACKUP_TEST_TASK_STORE) {
    $raw = Get-Content -Raw $env:ANALYTICS_BACKUP_TEST_TASK_STORE | ConvertFrom-Json
    foreach ($p in $raw.PSObject.Properties) { $store[$p.Name] = $p.Value }
  }
  return $store
}

function Save-FakeTasks($Store) {
  [IO.File]::WriteAllText($env:ANALYTICS_BACKUP_TEST_TASK_STORE, ($Store | ConvertTo-Json -Depth 4), $script:Utf8NoBom)
}

function Get-BackupTask([string]$Name) {
  if ($env:ANALYTICS_BACKUP_TEST_TASK_STORE) {
    $store = Read-FakeTasks
    if ($store.ContainsKey($Name)) { return $store[$Name] }
    return $null
  }
  try { $task = Get-ScheduledTask -TaskName $Name -ErrorAction Stop } catch { return $null }
  $info = $task | Get-ScheduledTaskInfo
  return [pscustomobject]@{ State = [string]$task.State; LastRunTime = $info.LastRunTime; LastTaskResult = $info.LastTaskResult; NextRunTime = $info.NextRunTime }
}

function Register-BackupTask([string]$Name, $Action, $Trigger, $Settings, $Principal) {
  if ($env:ANALYTICS_BACKUP_TEST_TASK_STORE) {
    $store = Read-FakeTasks
    $state = 'Disabled'; if ($Settings.Enabled) { $state = 'Ready' }
    $store[$Name] = [ordered]@{
      State = $state; LastRunTime = $null; LastTaskResult = $null; NextRunTime = $null
      Execute = $Action.Execute; Arguments = $Action.Arguments; WorkingDirectory = $Action.WorkingDirectory
      TriggerClass = $Trigger.CimClass.CimClassName; StartBoundary = $Trigger.StartBoundary; DaysInterval = $Trigger.DaysInterval
      StartWhenAvailable = $Settings.StartWhenAvailable; MultipleInstances = [string]$Settings.MultipleInstances
      ExecutionTimeLimit = $Settings.ExecutionTimeLimit; RestartCount = $Settings.RestartCount; RestartInterval = $Settings.RestartInterval
      UserId = $Principal.UserId; LogonType = [string]$Principal.LogonType; RunLevel = [string]$Principal.RunLevel
    }
    Save-FakeTasks $store
    return
  }
  Register-ScheduledTask -TaskName $Name -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal `
    -Description 'Daily local backup of portfolio analytics events (read-only). See docs/ANALYTICS-BACKUP.md.' | Out-Null
}

function Set-BackupTaskEnabled([string]$Name, [bool]$On) {
  if ($env:ANALYTICS_BACKUP_TEST_TASK_STORE) {
    $store = Read-FakeTasks
    $state = 'Disabled'; if ($On) { $state = 'Ready' }
    $store[$Name].State = $state
    Save-FakeTasks $store
    return
  }
  if ($On) { Enable-ScheduledTask -TaskName $Name | Out-Null } else { Disable-ScheduledTask -TaskName $Name | Out-Null }
}

function Remove-BackupTask([string]$Name) {
  if ($env:ANALYTICS_BACKUP_TEST_TASK_STORE) {
    $store = Read-FakeTasks
    $store.Remove($Name)
    Save-FakeTasks $store
    return
  }
  Unregister-ScheduledTask -TaskName $Name -Confirm:$false
}

function Show-Status {
  Write-Host "State folder : $StateDir"
  Write-Host ("Config       : {0}" -f $(if (Test-Path $script:Paths.Config) { 'present' } else { 'missing' }))
  Write-Host ("Credential   : {0}" -f $(if (Test-Path $script:Paths.Credential) { 'present (encrypted for this Windows user)' } else { 'missing' }))
  try {
    $config = Get-BackupConfig
    Write-Host "Database     : $($config.Database) as $($config.User) (sslmode $($config.SslMode))"
    Write-Host "psql         : $(Resolve-Psql $config.PsqlPath)"
  } catch { Write-Host "Config issue : $($_.Exception.Message)" }
  $checkpoint = $null
  try { $checkpoint = Read-Checkpoint } catch { Write-Host "Checkpoint   : ERROR $($_.Exception.Message)" }
  if ($checkpoint) {
    $rows = [long]0; $missing = 0; $conflicts = 0
    foreach ($entry in $checkpoint.days.Values) { $rows += $entry.rows; if ($entry.missingInSource -gt 0) { $missing++ }; if ($entry.conflicts -gt 0) { $conflicts++ } }
    Write-Host "Archived     : through $($checkpoint.archivedThroughDate) WIB, $($checkpoint.days.Count) day file(s), $rows row(s), last id $($checkpoint.lastId)"
    $nullRows = 0; if ($checkpoint.nullCreatedAt) { $nullRows = $checkpoint.nullCreatedAt.rows }
    Write-Host "NULL rows    : $nullRows in data\null-created-at.csv"
    Write-Host "Discrepancy  : $missing day(s) with rows no longer in the database, $conflicts day(s) with changed rows (data\discrepancies)"
    $damaged = Get-DamagedKeys $checkpoint
    Write-Host ("Damaged      : {0}" -f $(if ($damaged.Count -gt 0) { $damaged -join ', ' } else { 'none' }))
    Write-Host "Updated      : $($checkpoint.updatedAtUtc) (UTC)"
  }
  elseif (-not (Test-Path $script:Paths.Checkpoint)) { Write-Host 'Archived     : nothing yet' }
  $name = Get-TaskName
  $task = Get-BackupTask $name
  if ($task) { Write-Host "Task         : '$name' is $($task.State); last run $($task.LastRunTime) (result $($task.LastTaskResult)); next run $($task.NextRunTime)" }
  else { Write-Host "Task         : '$name' is not installed" }
  Write-Host ''
  Show-Logs 15
  return 0
}

function Show-Logs([int]$Count) {
  $files = @(Get-ChildItem -LiteralPath $script:Paths.Logs -Filter 'backup-*.log' -ErrorAction SilentlyContinue | Sort-Object Name)
  if ($files.Count -eq 0) { Write-Host 'No log yet.'; return 0 }
  $lines = @()
  foreach ($file in $files) { $lines += Get-Content -LiteralPath $file.FullName -Encoding UTF8 }
  Write-Host "Last $Count log line(s):"
  $lines | Select-Object -Last $Count | ForEach-Object { Write-Host "  $_" }
  return 0
}

function Set-Credential {
  if (-not (Test-Path $StateDir)) { New-Item -ItemType Directory -Force $StateDir | Out-Null }
  $secure = Read-Host -AsSecureString 'Password for the read-only backup role (input hidden)'
  if ($secure.Length -eq 0) { Write-Host 'Empty password; nothing saved.'; return 1 }
  # DPAPI (CurrentUser): only this Windows account on this computer can decrypt it.
  [IO.File]::WriteAllText($script:Paths.Credential, ($secure | ConvertFrom-SecureString), $script:Utf8NoBom)
  Write-Log 'INFO' 'Credential saved (encrypted with Windows DPAPI for the current user).'
  return 0
}

function Install-BackupTask {
  $config = Get-BackupConfig
  if (-not (Test-Path $script:Paths.Credential)) { throw 'Run set-credential before install.' }
  $name = $config.TaskName
  if (Get-BackupTask $name) { Write-Host "Task '$name' already exists. Run 'uninstall' first to re-create it."; return 1 }

  # 01:00 in Asia/Jakarta, expressed in this computer's local time zone.
  $wib = [TimeZoneInfo]::FindSystemTimeZoneById('SE Asia Standard Time')
  $wibToday = [TimeZoneInfo]::ConvertTime([DateTimeOffset]::UtcNow, $wib)
  $runAt = (New-Object DateTimeOffset ($wibToday.Date.AddHours(1)), $wib.BaseUtcOffset).ToLocalTime().DateTime

  $arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" run -StateDir "{1}"' -f $script:ScriptPath, $StateDir
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments -WorkingDirectory (Split-Path $script:ScriptPath -Parent)
  $trigger = New-ScheduledTaskTrigger -Daily -At $runAt
  $settingsArgs = @{
    StartWhenAvailable         = $true
    AllowStartIfOnBatteries    = $true
    DontStopIfGoingOnBatteries = $true
    ExecutionTimeLimit         = (New-TimeSpan -Hours 1)
    MultipleInstances          = 'IgnoreNew'
    RestartCount               = 3
    RestartInterval            = (New-TimeSpan -Minutes 30)
  }
  if (-not $Enable) { $settingsArgs.Disable = $true }
  $settings = New-ScheduledTaskSettingsSet @settingsArgs
  $principal = New-ScheduledTaskPrincipal -UserId ("{0}\{1}" -f $env:USERDOMAIN, $env:USERNAME) -LogonType Interactive -RunLevel Limited
  Register-BackupTask $name $action $trigger $settings $principal
  $state = if ($Enable) { 'ENABLED' } else { 'DISABLED (run "enable" when ready)' }
  Write-Log 'INFO' "Scheduled task '$name' installed for $($runAt.ToString('HH:mm')) local time (01:00 WIB), runs missed schedules when available; state: $state."
  return 0
}

function Set-TaskState([bool]$On) {
  $name = Get-TaskName
  if (-not (Get-BackupTask $name)) { Write-Host "Task '$name' is not installed. Run 'install' first."; return 1 }
  Set-BackupTaskEnabled $name $On
  if ($On) { Write-Log 'INFO' "Scheduled task '$name' enabled." }
  else { Write-Log 'INFO' "Scheduled task '$name' disabled. Archives were not changed." }
  return 0
}

function Uninstall-BackupTask {
  $name = Get-TaskName
  if (-not (Get-BackupTask $name)) { Write-Host "Task '$name' is not installed."; return 0 }
  Remove-BackupTask $name
  Write-Log 'INFO' "Scheduled task '$name' removed. Archives were not changed."
  return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
$script:ScriptPath = $PSCommandPath
$exitCode = 1
$mutex = $null
try {
  if (@('run', 'repair', 'rebuild-checkpoint') -contains $Command) {
    $mutex = New-Object Threading.Mutex($false, 'Local\PortfolioAnalyticsBackup')
    $owned = $false
    try { $owned = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $owned = $true }
    if (-not $owned) { $mutex.Dispose(); $mutex = $null; Write-Log 'WARN' 'Another backup operation is in progress; this one exits.'; $exitCode = 3 }
  }
  if ($exitCode -ne 3) {
    switch ($Command) {
      'run' { $exitCode = Invoke-Run }
      'check' { $exitCode = Invoke-Check }
      'verify' { $exitCode = Invoke-Verify }
      'repair' { $exitCode = Invoke-Repair }
      'rebuild-checkpoint' { $exitCode = Invoke-RebuildCheckpoint }
      'status' { $exitCode = Show-Status }
      'logs' { $exitCode = Show-Logs $Tail }
      'set-credential' { $exitCode = Set-Credential }
      'install' { $exitCode = Install-BackupTask }
      'enable' { $exitCode = Set-TaskState $true }
      'disable' { $exitCode = Set-TaskState $false }
      'uninstall' { $exitCode = Uninstall-BackupTask }
    }
  }
}
catch {
  try { Write-Log 'ERROR' ("{0} failed: {1}" -f $Command, (Get-ErrorText $_)) } catch { Write-Host (Protect-Text $_.Exception.Message) }
  $exitCode = 1
}
finally {
  if ($mutex) { try { $mutex.ReleaseMutex() } catch { }; $mutex.Dispose() }
  $script:Secret = $null
}
exit $exitCode
