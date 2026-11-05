#Requires -Version 5.1
<#
.SYNOPSIS
  End-to-end tests for analytics-backup.ps1 against a throwaway local PostgreSQL cluster.

.DESCRIPTION
  Needs PostgreSQL 14+ server binaries (initdb, pg_ctl, psql) on this computer. Creates a
  temporary cluster in %TEMP% on 127.0.0.1, runs every scenario, then stops and deletes it.
  Never contacts Neon. Task Scheduler commands use a JSON test store
  (ANALYTICS_BACKUP_TEST_TASK_STORE), so no real scheduled task is created.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\analytics-backup\tests\Test-AnalyticsBackup.ps1
#>
[CmdletBinding()]
param(
  [string]$PgBin = 'C:\Program Files\PostgreSQL\17\bin',
  [int]$Port = 55434
)
Set-StrictMode -Version 2
$ErrorActionPreference = 'Stop'

$Script = Join-Path (Split-Path $PSScriptRoot -Parent) 'analytics-backup.ps1'
$Work = Join-Path $env:TEMP ('analytics-backup-test-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$Data = Join-Path $Work 'pgdata'
$State = Join-Path $Work 'state'
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
$script:Passed = 0
$script:Failed = 0
$script:AllOutput = New-Object System.Text.StringBuilder

function New-Secret { return -join ((1..32) | ForEach-Object { [char[]]'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[(Get-Random -Maximum 56)] }) }
$OwnerPw = New-Secret; $ReadPw = New-Secret; $WritePw = New-Secret

function Check([bool]$Condition, [string]$Name, $Result = $null) {
  if ($Condition) { $script:Passed++; Write-Host "  PASS  $Name" -ForegroundColor Green }
  else {
    $script:Failed++; Write-Host "  FAIL  $Name" -ForegroundColor Red
    if ($Result) { Write-Host ("        exit {0}: {1}" -f $Result.Code, ($Result.Text.Trim() -replace "`r?`n", "`n        ")) }
  }
}

function Invoke-Native([string]$File, [string]$Arguments, [hashtable]$Environment = @{}) {
  $psi = New-Object Diagnostics.ProcessStartInfo
  $psi.FileName = $File; $psi.Arguments = $Arguments
  $psi.UseShellExecute = $false; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true; $psi.CreateNoWindow = $true
  $psi.StandardOutputEncoding = [Text.Encoding]::UTF8; $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
  foreach ($key in $Environment.Keys) { $psi.EnvironmentVariables[$key] = $Environment[$key] }
  $p = [Diagnostics.Process]::Start($psi)
  $out = $p.StandardOutput.ReadToEndAsync(); $err = $p.StandardError.ReadToEndAsync()
  $p.WaitForExit()
  $text = $out.Result + $err.Result
  [void]$script:AllOutput.Append($text)
  return @{ Code = $p.ExitCode; Out = $out.Result; Err = $err.Result; Text = $text }
}

function Invoke-Owner([string]$Sql, [string]$Database = 'neondb') {
  $file = Join-Path $Work ('owner-' + [guid]::NewGuid().ToString('N') + '.sql')
  [IO.File]::WriteAllText($file, $Sql, $Utf8NoBom)
  $r = Invoke-Native (Join-Path $PgBin 'psql.exe') ('-X -q -A -t -v ON_ERROR_STOP=1 -h 127.0.0.1 -p {0} -U owner -d {1} -f "{2}"' -f $Port, $Database, $file) @{ PGPASSWORD = $OwnerPw; PGCLIENTENCODING = 'UTF8' }
  Remove-Item $file
  if ($r.Code -ne 0) { throw "owner SQL failed: $($r.Err)" }
  return @($r.Out -split "`r?`n" | Where-Object { $_ -ne '' })
}

function Invoke-Backup([string]$Command, [string]$AsOf, [hashtable]$Environment = @{}, [string]$Extra = '', [string]$Dir = $State) {
  $arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" {1} -StateDir "{2}"' -f $Script, $Command, $Dir
  if ($AsOf) { $arguments += ' -AsOfUtc ' + $AsOf }
  if ($Extra) { $arguments += ' ' + $Extra }
  return Invoke-Native 'powershell.exe' $arguments $Environment
}

function Set-BackupConfig([string]$User, [string]$Password, [string]$HostName = '127.0.0.1', [string]$SslMode = 'disable', [string]$Dir = $State) {
  New-Item -ItemType Directory -Force $Dir | Out-Null
  $config = [ordered]@{ host = $HostName; port = $Port; database = 'neondb'; user = $User; sslMode = $SslMode; psqlPath = (Join-Path $PgBin 'psql.exe'); taskName = 'Analytics Backup TEST (mock)' }
  [IO.File]::WriteAllText((Join-Path $Dir 'config.json'), ($config | ConvertTo-Json), $Utf8NoBom)
  $encrypted = ConvertTo-SecureString $Password -AsPlainText -Force | ConvertFrom-SecureString
  [IO.File]::WriteAllText((Join-Path $Dir 'credential.dpapi'), $encrypted, $Utf8NoBom)
}

function Get-DayPath([string]$Day, [string]$Dir = $State) { return Join-Path $Dir ("data\events\{0}\{1}.csv" -f $Day.Substring(0, 4), $Day) }
function Get-NullPath([string]$Dir = $State) { return Join-Path $Dir 'data\null-created-at.csv' }
function Get-CsvRows([string]$Path) { return @(Import-Csv -LiteralPath $Path -Encoding UTF8) }
function Get-CsvIds([string]$Path) { return @(Get-CsvRows $Path | ForEach-Object { [long]$_.id }) }
function Get-DbIds([string]$Day) {
  $next = ([DateTime]::ParseExact($Day, 'yyyy-MM-dd', $null)).AddDays(1).ToString('yyyy-MM-dd')
  return @(Invoke-Owner "SELECT id FROM analytics_events WHERE created_at >= TIMESTAMP '$Day 00:00' AT TIME ZONE 'Asia/Jakarta' AND created_at < TIMESTAMP '$next 00:00' AT TIME ZONE 'Asia/Jakarta' ORDER BY id;" | ForEach-Object { [long]$_ })
}
function Same-Ids($A, $B) { return ((@($A | Sort-Object) -join ',') -eq (@($B | Sort-Object) -join ',')) }
function Get-FileHashText([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash }
# Hashes of archive CSV files only (day files and the NULL file).
function Get-ArchiveHashes([string]$Dir = $State) {
  $map = @{}
  $root = Join-Path $Dir 'data'
  Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { ($_.Name -match '^\d{4}-\d{2}-\d{2}\.csv$' -or $_.Name -eq 'null-created-at.csv') -and $_.FullName -notmatch '\\repairs\\' } |
    ForEach-Object { $map[$_.FullName.Substring($root.Length + 1)] = Get-FileHashText $_.FullName }
  return $map
}
function Same-Hashes($A, $B) {
  if ($A.Count -ne $B.Count) { return $false }
  foreach ($key in $A.Keys) { if (-not $B.ContainsKey($key) -or $A[$key] -ne $B[$key]) { return $false } }
  return $true
}
function Read-Checkpoint([string]$Dir = $State) { return Get-Content -Raw (Join-Path $Dir 'checkpoint.json') | ConvertFrom-Json }
function Get-LogPath([string]$Name) { return Join-Path $State "data\discrepancies\$Name.jsonl" }
function Read-Events([string]$Name) {
  $path = Get-LogPath $Name
  if (-not (Test-Path $path)) { return @() }
  return @([IO.File]::ReadAllLines($path) | Where-Object { $_ } | ForEach-Object { $_ | ConvertFrom-Json })
}
function Get-EventKinds([string]$Name, [long]$Id) { return (@(Read-Events $Name | Where-Object { [long]$_.id -eq $Id } | ForEach-Object { $_.kind }) -join ',') }
function Wib([string]$Local) { return "TIMESTAMP '$Local' AT TIME ZONE 'Asia/Jakarta'" }
function Insert-Event([string]$CreatedAtSql, [string]$Referrer = 'NULL', [string]$Metadata = "'{}'") {
  return [long]@(Invoke-Owner "INSERT INTO analytics_events (event_name, path, session_id, referrer, metadata, created_at) VALUES ('page_view', '/', 's-' || substr(md5(random()::text), 1, 8), $Referrer, $Metadata, $CreatedAtSql) RETURNING id;")[0]
}
function Insert-Null([string]$Session) {
  return [long]@(Invoke-Owner "INSERT INTO analytics_events (event_name, path, session_id, created_at) VALUES ('page_view', '/', '$Session', NULL) RETURNING id;")[0]
}

try {
  Write-Host "Work folder: $Work"
  New-Item -ItemType Directory -Force $Work | Out-Null
  $pwFile = Join-Path $Work 'pw.txt'; [IO.File]::WriteAllText($pwFile, $OwnerPw, $Utf8NoBom)
  $r = Invoke-Native (Join-Path $PgBin 'initdb.exe') ('-D "{0}" -U owner -A scram-sha-256 --pwfile="{1}" -E UTF8 --locale=C' -f $Data, $pwFile)
  Remove-Item $pwFile
  if ($r.Code -ne 0) { throw "initdb failed: $($r.Err)" }
  # Not redirected: the server started by pg_ctl would inherit the pipes and keep them open.
  $start = New-Object Diagnostics.ProcessStartInfo
  $start.FileName = Join-Path $PgBin 'pg_ctl.exe'
  $start.Arguments = '-D "{0}" -o "-p {1} -c listen_addresses=127.0.0.1" -l "{2}" -w -s start' -f $Data, $Port, (Join-Path $Work 'pg.log')
  $start.UseShellExecute = $false; $start.CreateNoWindow = $true
  $pgctl = [Diagnostics.Process]::Start($start); $pgctl.WaitForExit()
  if ($pgctl.ExitCode -ne 0) { throw 'pg_ctl start failed; see pg.log.' }

  Invoke-Owner 'CREATE DATABASE neondb;' 'postgres' | Out-Null
  Invoke-Owner @"
CREATE SEQUENCE analytics_events_id_seq START 1000;
CREATE TABLE public.analytics_events (
  id bigint NOT NULL DEFAULT nextval('analytics_events_id_seq'::regclass) PRIMARY KEY,
  event_name character varying NOT NULL,
  path character varying NOT NULL,
  visitor_id character varying,
  session_id character varying,
  referrer text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE ROLE analytics_backup LOGIN PASSWORD '$ReadPw';
GRANT CONNECT ON DATABASE neondb TO analytics_backup;
GRANT USAGE ON SCHEMA public TO analytics_backup;
GRANT SELECT ON public.analytics_events TO analytics_backup;
CREATE ROLE writer LOGIN PASSWORD '$WritePw';
GRANT CONNECT ON DATABASE neondb TO writer;
GRANT USAGE ON SCHEMA public TO writer;
GRANT SELECT, INSERT ON public.analytics_events TO writer;
"@ | Out-Null

  # ----------------------------------------------------------------- 1. normal backup
  Write-Host "`n1. Normal backup, WIB date boundary, CSV content"
  $r1 = Insert-Event (Wib '2026-09-30 23:59:59.999999')
  $r2 = Insert-Event (Wib '2026-10-01 00:00:00')
  $tricky = "E'https://x.test/a,\""b\""\nline2'"
  $unicode = "$([char]0x00E9) $([char]0x2713)"
  $r3 = Insert-Event (Wib '2026-10-01 12:00:00') $tricky "'{""language"":""id"",""note"":""$unicode""}'"
  $r4 = Insert-Event (Wib '2026-10-02 08:00:00') "''"
  $n1 = Insert-Null 's-null-1'
  $n2 = Insert-Null 's-null-2'
  Set-BackupConfig 'analytics_backup' $ReadPw
  $check = Invoke-Backup 'check'
  Check ($check.Code -eq 0 -and $check.Text -match 'Role is read-only') 'check: read-only role accepted' $check
  $run = Invoke-Backup 'run' '2026-10-02T18:00:00Z'   # 2026-10-03 01:00 WIB
  Check ($run.Code -eq 0) 'run exits 0' $run
  if ($run.Code -ne 0) { throw 'Stopping: the first backup run failed.' }
  foreach ($day in '2026-09-30', '2026-10-01', '2026-10-02') {
    Check ((Test-Path (Get-DayPath $day)) -and (Same-Ids (Get-CsvIds (Get-DayPath $day)) (Get-DbIds $day))) "day $day file matches database ids"
  }
  Check ((Get-CsvIds (Get-DayPath '2026-09-30')) -contains $r1) '23:59:59.999999 WIB stays on the earlier date'
  Check ((Get-CsvIds (Get-DayPath '2026-10-01')) -contains $r2) '00:00:00 WIB starts the new date'
  $row3 = Get-CsvRows (Get-DayPath '2026-10-01') | Where-Object { [long]$_.id -eq $r3 }
  Check ($row3.referrer -eq "https://x.test/a,`"b`"`nline2") 'comma, quotes, and newline survive the CSV round trip'
  Check ($row3.metadata.Contains($unicode)) 'UTF-8 metadata survives'
  Check ($row3.created_at_wib -eq '2026-10-01 12:00:00.000000' -and $row3.created_at_utc -eq '2026-10-01T05:00:00.000000Z') 'UTC and WIB timestamps are both exported'
  Check (([IO.File]::ReadAllText((Get-DayPath '2026-10-02'))) -match ',"",') 'empty string is kept distinct from NULL ("")'
  Check (Same-Ids (Get-CsvIds (Get-NullPath)) @($n1, $n2)) 'rows with NULL created_at are saved separately'
  $cp = Read-Checkpoint
  Check ($cp.version -eq 2 -and $cp.archivedThroughDate -eq '2026-10-02' -and $cp.nullCreatedAt.rows -eq 2 -and $cp.days.'2026-10-01'.sourceMd5 -match '^[0-9a-f]{32}$') 'checkpoint records progress and per-day fingerprints'
  Check ((Invoke-Backup 'verify').Code -eq 0) 'verify passes'

  # ----------------------------------------------------------------- 2. rerun is idempotent
  Write-Host "`n2. Re-running does not duplicate or rewrite"
  $before = Get-ArchiveHashes
  $again = Invoke-Backup 'run' '2026-10-02T18:00:00Z'
  Check ($again.Code -eq 0 -and $again.Text -match 'Archive is up to date') 'second run finds nothing to synchronise' $again
  Check (Same-Hashes $before (Get-ArchiveHashes)) 'archive files are byte-for-byte unchanged'

  # ----------------------------------------------------------------- 3. settle window at midnight
  Write-Host "`n3. A day is archived only 15 minutes after it ends (WIB)"
  $r5 = Insert-Event (Wib '2026-10-03 23:58:00')
  Invoke-Backup 'run' '2026-10-03T17:10:00Z' | Out-Null   # 2026-10-04 00:10 WIB
  Check (-not (Test-Path (Get-DayPath '2026-10-03'))) '00:10 WIB: previous day not archived yet'
  Invoke-Backup 'run' '2026-10-03T17:16:00Z' | Out-Null   # 00:16 WIB
  Check ((Test-Path (Get-DayPath '2026-10-03')) -and ((Get-CsvIds (Get-DayPath '2026-10-03')) -contains $r5)) '00:16 WIB: previous day archived with its 23:58 row'

  # ----------------------------------------------------------------- 4. interrupted replacement, then resume
  Write-Host "`n4. Replacement interrupted in the middle, then resumed"
  $late1 = Insert-Event (Wib '2026-10-01 09:00:00')   # new row for an archived day
  $r6 = Insert-Event (Wib '2026-10-04 10:00:00')
  $r7 = Insert-Event (Wib '2026-10-06 10:00:00'); $r8 = Insert-Event (Wib '2026-10-06 22:00:00')
  $oldFile = Get-DayPath '2026-10-01'
  $oldHash = Get-FileHashText $oldFile
  $oldEntry = (Read-Checkpoint).days.'2026-10-01'
  [IO.File]::WriteAllText((Get-DayPath '2026-10-02') + '.new', 'garbage left by a crash', $Utf8NoBom)
  $fail = Invoke-Backup 'run' '2026-10-06T18:00:00Z' @{ ANALYTICS_BACKUP_TEST_FAIL_BEFORE_COMMIT = '2026-10-01' }
  Check ($fail.Code -eq 1) 'interrupted run exits 1' $fail
  Check ((Get-FileHashText $oldFile) -eq $oldHash) 'existing archive file untouched when the replacement stops before commit'
  Check (Test-Path ($oldFile + '.new')) 'the unfinished replacement is left as .new'
  Check ((Read-Checkpoint).days.'2026-10-01'.sha256 -eq $oldEntry.sha256) 'checkpoint still describes the old file'
  $resume = Invoke-Backup 'run' '2026-10-06T18:00:00Z'
  Check ($resume.Code -eq 0) 'resumed run exits 0' $resume
  Check (-not (Test-Path ($oldFile + '.new')) -and -not (Test-Path ((Get-DayPath '2026-10-02') + '.new'))) 'resume clears .new files from the archive folders'
  $setAside = @(Get-ChildItem (Join-Path $State 'data\repairs') -Recurse -File -Filter '*.csv.new' | ForEach-Object { $_.Name } | Sort-Object)
  Check (($setAside -join ',') -eq '2026-10-01.csv.new,2026-10-02.csv.new' -and $resume.Text -match 'kept in data\\repairs\\unfinished-') 'unfinished files with rows not in the archive are set aside, not deleted' $resume
  Check (Same-Ids (Get-CsvIds $oldFile) (Get-DbIds '2026-10-01') -and ((Get-CsvIds $oldFile) -contains $late1)) 'late row added to the archived day without duplicates'
  Check ((Test-Path ($oldFile + '.bak')) -and (Get-FileHashText ($oldFile + '.bak')) -eq $oldHash) 'previous version kept as .bak after an atomic replace'
  Check ((Get-FileHashText (Get-DayPath '2026-10-02')) -eq $before['events\2026\2026-10-02.csv']) 'a day without changes is not rewritten'
  Check (@(Get-CsvRows (Get-DayPath '2026-10-05')).Count -eq 0 -and (Get-Content (Get-DayPath '2026-10-05') -First 1) -like 'id,*') 'a day without visits gets a header-only file'
  Check ((Same-Ids (Get-CsvIds (Get-DayPath '2026-10-06')) @($r7, $r8)) -and (Read-Checkpoint).archivedThroughDate -eq '2026-10-06') 'days after the interruption archived; checkpoint advanced'

  # ----------------------------------------------------------------- 5. missed days
  Write-Host "`n5. Computer off for several days"
  foreach ($day in '2026-10-07', '2026-10-08', '2026-10-10') { Insert-Event (Wib "$day 09:30:00") | Out-Null }
  $catch = Invoke-Backup 'run' '2026-10-10T18:30:00Z'    # 2026-10-11 01:30 WIB
  Check ($catch.Code -eq 0) 'catch-up run exits 0' $catch
  foreach ($day in '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10') {
    Check ((Test-Path (Get-DayPath $day)) -and (Same-Ids (Get-CsvIds (Get-DayPath $day)) (Get-DbIds $day))) "missed day $day archived"
  }

  # ----------------------------------------------------------------- 6. database has fewer rows than the archive
  Write-Host "`n6. Archive holds 10 rows, the database only 8"
  $ten = @(); for ($i = 0; $i -lt 10; $i++) { $ten += Insert-Event (Wib ('2026-10-11 {0:00}:00:00' -f ($i + 8))) }
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  Check (@(Get-CsvIds (Get-DayPath '2026-10-11')).Count -eq 10) 'day archived with 10 rows'
  $hash11 = Get-FileHashText (Get-DayPath '2026-10-11')
  Invoke-Owner "DELETE FROM analytics_events WHERE id IN ($($ten[2]), $($ten[7]));" | Out-Null
  $shrink = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($shrink.Code -eq 0 -and $shrink.Text -match 'now returns 8 row\(s\) for 2026-10-11 but the archive holds 10') 'clear warning that the database has fewer rows' $shrink
  Check ((Get-FileHashText (Get-DayPath '2026-10-11')) -eq $hash11 -and @(Get-CsvIds (Get-DayPath '2026-10-11')).Count -eq 10) 'archive keeps all 10 rows, file unchanged'
  $missing11 = @(Read-Events '2026-10-11' | Where-Object { $_.kind -eq 'missing' })
  Check ((Same-Ids @($missing11 | ForEach-Object { [long]$_.id }) @($ten[2], $ten[7])) -and @($missing11 | Where-Object { -not $_.archived }).Count -eq 0) 'discrepancy log records the 2 missing ids with their archived rows'
  Check ((Read-Checkpoint).days.'2026-10-11'.missingInSource -eq 2) 'checkpoint counts the discrepancy'
  $quiet = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($quiet.Text -match 'Archive is up to date' -and (Get-FileHashText (Get-DayPath '2026-10-11')) -eq $hash11) 'unchanged database state is not re-downloaded' $quiet
  Check (@(Read-Events '2026-10-11').Count -eq 2) 'no duplicate discrepancy events on re-run'

  # ----------------------------------------------------------------- 7. late rows with a smaller id than MAX(id)
  Write-Host "`n7. Late events whose id is below the largest archived id"
  $maxId = (Read-Checkpoint).lastId
  Invoke-Owner "INSERT INTO analytics_events (id, event_name, path, session_id, created_at) VALUES (500, 'page_view', '/', 's-low', $(Wib '2026-10-02 15:00:00'));" | Out-Null
  Invoke-Owner "UPDATE analytics_events SET created_at = $(Wib '2026-10-08 20:00:00') WHERE id = $n2;" | Out-Null
  $low = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($low.Code -eq 0 -and 500 -lt $maxId) "run exits 0 (largest archived id $maxId)" $low
  Check ((Get-CsvIds (Get-DayPath '2026-10-02')) -contains 500 -and (Same-Ids (Get-CsvIds (Get-DayPath '2026-10-02')) (Get-DbIds '2026-10-02'))) 'row with id 500 added to 2026-10-02 without duplicates'
  Check ((Get-CsvIds (Get-DayPath '2026-10-08')) -contains $n2) 'a former NULL row that received a date appears in that day'
  Check ((Get-CsvIds (Get-NullPath)) -contains $n2 -and (Get-EventKinds 'null-created-at' $n2) -eq 'missing') 'the NULL archive keeps its old version and reports it'

  # ----------------------------------------------------------------- 8. same id, different content
  Write-Host "`n8. Same id, different content"
  $hash02 = Get-FileHashText (Get-DayPath '2026-10-02')
  Invoke-Owner "UPDATE analytics_events SET referrer = 'https://changed.example' WHERE id = $r4;" | Out-Null
  $conflict = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($conflict.Text -match '1 row\(s\) of 2026-10-02 differ between the database and the archive') 'conflict reported in the log' $conflict
  Check ((Get-FileHashText (Get-DayPath '2026-10-02')) -eq $hash02 -and ((Get-CsvRows (Get-DayPath '2026-10-02')) | Where-Object { [long]$_.id -eq $r4 }).referrer -eq '') 'archived version kept, not overwritten'
  $c = @(Read-Events '2026-10-02' | Where-Object { [long]$_.id -eq $r4 -and $_.kind -eq 'conflict' })
  Check ($c.Count -eq 1 -and $c[0].source -match 'changed\.example' -and $c[0].archived -notmatch 'changed\.example') 'discrepancy log holds both versions'

  # ----------------------------------------------------------------- 8b. discrepancy history is cumulative
  Write-Host "`n8b. Discrepancy history is kept across repeated changes"
  Invoke-Owner "UPDATE analytics_events SET referrer = 'https://changed-again.example' WHERE id = $r4;" | Out-Null
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  Invoke-Owner "UPDATE analytics_events SET referrer = '' WHERE id = $r4;" | Out-Null
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  $history = @(Read-Events '2026-10-02' | Where-Object { [long]$_.id -eq $r4 })
  Check ((($history | ForEach-Object { $_.kind }) -join ',') -eq 'conflict,conflict,resolved') 'second change and restoration are added, nothing removed or duplicated'
  Check ($history[0].source -match 'changed\.example' -and $history[1].source -match 'changed-again\.example' -and $history[2].archived -eq $history[0].archived) 'both source versions and the archived version stay traceable'
  $before8b = [IO.File]::ReadAllText((Get-LogPath '2026-10-02'))
  $saved4 = @(Invoke-Owner "SELECT session_id FROM analytics_events WHERE id = $r4;")[0]
  Invoke-Owner "DELETE FROM analytics_events WHERE id = $r4;" | Out-Null
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  Invoke-Owner "INSERT INTO analytics_events (id, event_name, path, session_id, referrer, metadata, created_at) VALUES ($r4, 'page_view', '/', '$saved4', '', '{}', $(Wib '2026-10-02 08:00:00'));" | Out-Null
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  $after8b = [IO.File]::ReadAllText((Get-LogPath '2026-10-02'))
  Check ($after8b.StartsWith($before8b) -and (Get-EventKinds '2026-10-02' $r4) -eq 'conflict,conflict,resolved,missing,resolved') 'deletion and reappearance appended; earlier lines byte-identical'

  # ----------------------------------------------------------------- 8c. corrupt discrepancy log
  Write-Host "`n8c. Corrupt discrepancy log"
  $log11 = Get-LogPath '2026-10-11'
  [IO.File]::AppendAllText($log11, '{ broken', $Utf8NoBom)
  $corruptText = [IO.File]::ReadAllText($log11)
  $v = Invoke-Backup 'verify'
  Check ($v.Code -eq 1 -and $v.Text -match 'FAIL discrepancies\\2026-10-11\.jsonl') 'verify reports the corrupt discrepancy log' $v
  Invoke-Owner "DELETE FROM analytics_events WHERE id = $($ten[3]);" | Out-Null
  $cr = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  $moved = @(Get-ChildItem (Join-Path $State 'data\discrepancies') -Directory -Filter 'corrupt-*' | ForEach-Object { Join-Path $_.FullName '2026-10-11.jsonl' } | Where-Object { Test-Path $_ })
  Check ($cr.Code -eq 4 -and $cr.Text -match 'is not valid' -and $cr.Text -match 'need attention') 'run reports the corrupt log and exits 4' $cr
  Check ($moved.Count -eq 1 -and [IO.File]::ReadAllText($moved[0]) -eq $corruptText) 'corrupt log moved aside unchanged, not overwritten'
  Check (Same-Ids @(Read-Events '2026-10-11' | ForEach-Object { [long]$_.id }) @($ten[2], $ten[7], $ten[3])) 'new log restarts with every open discrepancy'
  $v2 = Invoke-Backup 'verify'
  Check ($v2.Code -eq 0 -and $v2.Text -match 'set-aside discrepancy logs') 'verify passes and points to the set-aside log' $v2

  # ----------------------------------------------------------------- 8d. replacement finished, checkpoint not saved
  Write-Host "`n8d. Crash after the file replacement but before the checkpoint was saved"
  $cpFile = Join-Path $State 'checkpoint.json'
  $cpOld = [IO.File]::ReadAllText($cpFile)
  Insert-Event (Wib '2026-10-07 18:00:00') | Out-Null
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  $file07 = Get-DayPath '2026-10-07'
  $good07 = [IO.File]::ReadAllBytes($file07)
  [IO.File]::WriteAllText($cpFile, $cpOld, $Utf8NoBom)
  $note = Invoke-Backup 'verify'
  Check ($note.Code -eq 0 -and $note.Text -match 'NOTE 2026-10-07 : replacement finished') 'verify recognises the interrupted replacement' $note
  # Negative case: an earlier row was also changed by hand, so it must still count as damaged.
  $edited = [Text.Encoding]::UTF8.GetString($good07) -replace "(`n\d+,page_view,/),", '$1-edited,'
  [IO.File]::WriteAllText($file07, $edited, $Utf8NoBom)
  $neg = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($neg.Code -eq 4 -and $neg.Text -match '2026-10-07 is missing or changed') 'a changed earlier row is still reported as damaged, not accepted' $neg
  [IO.File]::WriteAllBytes($file07, $good07)
  $acc = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($acc.Code -eq 0 -and $acc.Text -match '2026-10-07 was replaced by an earlier run that stopped before saving the checkpoint') 'next run accepts the finished replacement' $acc
  Check ((Invoke-Backup 'verify').Code -eq 0 -and [Convert]::ToBase64String([IO.File]::ReadAllBytes($file07)) -eq [Convert]::ToBase64String($good07)) 'file kept as written; verify passes'

  # ----------------------------------------------------------------- 8e. non-ISO DateStyle
  Write-Host "`n8e. Server or role DateStyle that is not ISO"
  $hashesE = Get-ArchiveHashes
  Invoke-Owner "ALTER ROLE analytics_backup SET DateStyle = 'SQL, DMY';" | Out-Null
  $ds = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Invoke-Owner "ALTER ROLE analytics_backup RESET DateStyle;" | Out-Null
  Check ($ds.Code -eq 0 -and $ds.Text -match 'Archive is up to date' -and (Same-Hashes $hashesE (Get-ArchiveHashes))) 'run works and finds nothing new with DateStyle SQL, DMY' $ds

  # ----------------------------------------------------------------- 8f. unfinished .new files (L2)
  Write-Host "`n8f. Unfinished .new files after a crash"
  # A .new whose rows are all in the archive is stale and is removed.
  $file03 = Get-DayPath '2026-10-03'
  Copy-Item $file03 ($file03 + '.new')
  $stale = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check (-not (Test-Path ($file03 + '.new')) -and $stale.Text -match 'all its rows are in the archive') 'a .new file fully covered by the archive is removed' $stale
  # ReplaceFile failed half-way: target renamed to .bak, the new file left as .new, and the
  # extra row has since been deleted from the database. Nothing may be lost.
  $file05 = Get-DayPath '2026-10-05'
  $extra = Insert-Event (Wib '2026-10-05 12:00:00')
  Invoke-Backup 'run' '2026-10-11T18:30:00Z' | Out-Null
  Check ((Get-CsvIds $file05) -contains $extra) 'row archived before the simulated failure'
  Copy-Item $file05 ($file05 + '.new')
  Move-Item $file05 ($file05 + '.bak') -Force
  [IO.File]::WriteAllText($file05 + '.bak', "id,event_name,path,visitor_id,session_id,referrer,metadata,created_at_utc,created_at_wib`n", $Utf8NoBom)
  Invoke-Owner "DELETE FROM analytics_events WHERE id = $extra;" | Out-Null
  $half = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($half.Code -eq 4 -and $half.Text -match 'unfinished-' -and -not (Test-Path ($file05 + '.new'))) 'half-finished replacement: .new set aside, day reported' $half
  $fix05 = Invoke-Backup 'repair' $null @{} '-Day 2026-10-05'
  Check ($fix05.Code -eq 0 -and (Get-CsvIds $file05) -contains $extra) 'repair recovers the row from the set-aside .new file' $fix05
  Check ((Get-EventKinds '2026-10-05' $extra) -eq 'missing') 'the row no longer in the database is reported as missing'

  # ----------------------------------------------------------------- 8g. strict CSV quotes (L3)
  Write-Host "`n8g. Quote inside an unquoted field"
  $file10 = Get-DayPath '2026-10-10'
  $orig10 = [IO.File]::ReadAllBytes($file10)
  [IO.File]::WriteAllText($file10, ([Text.Encoding]::UTF8.GetString($orig10) -replace "(`n\d+,page_view,)/,", '$1/x"y,'), $Utf8NoBom)
  $q = Invoke-Backup 'verify'
  Check ($q.Code -eq 1 -and $q.Text -match 'FAIL 2026-10-10 : a quote inside an unquoted field') 'verify rejects a quote inside an unquoted field' $q
  [IO.File]::WriteAllBytes($file10, $orig10)

  # ----------------------------------------------------------------- 8h. fingerprint with separator characters (L4)
  Write-Host "`n8h. Fingerprint with control characters and emoji in the data"
  $ctl = Insert-Event (Wib '2026-10-09 07:00:00') "'a' || chr(31) || 'b' || chr(30) || chr(29) || 'c'" "'{""e"":""$([char]0xD83D)$([char]0xDE00)""}'"
  $fp = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($fp.Code -eq 0 -and (Get-CsvIds (Get-DayPath '2026-10-09')) -contains $ctl) 'database and local fingerprints agree for control characters and emoji' $fp
  $probe = Join-Path $Work 'fingerprint-probe.ps1'
  [IO.File]::WriteAllText($probe, @"
`$src = [IO.File]::ReadAllText('$Script')
`$m = [regex]::Match(`$src, "Add-Type -Language CSharp -TypeDefinition @'\r?\n(.*?)\r?\n'@", 'Singleline')
Add-Type -Language CSharp -TypeDefinition `$m.Groups[1].Value
function Rows([string]`$text) { `$r = [AnalyticsBackupCsv]::Parse(`$text); foreach (`$x in `$r) { `$x.Id = [long]`$x.Fields[0] }; return , `$r }
`$a = Rows ("1,a" + [char]0x1F + ",b"); `$b = Rows ("1,a," + [char]0x1F + "b")
`$c = Rows ('1,,x'); `$d = Rows ('1,"",x')
if ([AnalyticsBackupCsv]::Fingerprint(`$a) -ne [AnalyticsBackupCsv]::Fingerprint(`$b) -and [AnalyticsBackupCsv]::Fingerprint(`$c) -ne [AnalyticsBackupCsv]::Fingerprint(`$d)) { 'DISTINCT' } else { 'COLLISION' }
"@, $Utf8NoBom)
  $probeRun = Invoke-Native 'powershell.exe' ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}"' -f $probe)
  Check ($probeRun.Out.Trim() -eq 'DISTINCT') 'rows that used to collide (separator inside a field) now differ; NULL differs from empty' $probeRun

  # ----------------------------------------------------------------- 8i. repair -PreferDatabase (L5)
  Write-Host "`n8i. Repair: local edits versus -PreferDatabase"
  $row10 = @(Get-CsvRows $file10)[0]
  $id10 = [long]$row10.id
  [IO.File]::WriteAllText($file10, ([Text.Encoding]::UTF8.GetString($orig10) -replace "(`n$id10,page_view,)/,", '$1/edited-by-hand,'), $Utf8NoBom)
  $keep = Invoke-Backup 'repair' $null @{} '-Day 2026-10-10'
  Check ($keep.Code -eq 0 -and @(Get-CsvRows $file10)[0].path -eq '/edited-by-hand' -and (Get-EventKinds '2026-10-10' $id10) -eq 'conflict') 'default repair keeps the local version and records a conflict' $keep
  $prefer = Invoke-Backup 'repair' $null @{} '-Day 2026-10-10 -PreferDatabase'
  Check ($prefer.Code -eq 0 -and @(Get-CsvRows $file10)[0].path -eq '/' -and $prefer.Text -match 'took the database version') 'repair -PreferDatabase restores the database version' $prefer
  $events10 = @(Read-Events '2026-10-10' | Where-Object { [long]$_.id -eq $id10 })
  Check ((($events10 | ForEach-Object { $_.kind }) -join ',') -eq 'conflict,replaced' -and $events10[1].archived -match 'edited-by-hand') 'the replaced local version stays in the discrepancy log'
  $after10 = Invoke-Backup 'run' '2026-10-11T18:30:00Z'
  Check ($after10.Code -eq 0 -and (Get-EventKinds '2026-10-10' $id10) -eq 'conflict,replaced' -and (Invoke-Backup 'verify').Code -eq 0) 'next run adds nothing for the replaced row; verify passes' $after10

  # ----------------------------------------------------------------- 8j. PowerShell environment (L6)
  Write-Host "`n8j. Constrained Language Mode and an outdated helper in the session"
  # A child session switched to Constrained Language Mode (no system setting is changed).
  $clmProbe = Join-Path $Work 'clm-probe.ps1'
  [IO.File]::WriteAllText($clmProbe, "`$ExecutionContext.SessionState.LanguageMode = 'ConstrainedLanguage'`n& '$Script' status -StateDir '$State'`nexit `$LASTEXITCODE`n", $Utf8NoBom)
  $clm = Invoke-Native 'powershell.exe' ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}"' -f $clmProbe)
  Check ($clm.Code -eq 1 -and $clm.Text -match 'needs PowerShell FullLanguage mode') 'Constrained Language Mode stops with a clear message' $clm
  $staleProbe = Join-Path $Work 'stale-helper.ps1'
  [IO.File]::WriteAllText($staleProbe, "Add-Type -TypeDefinition 'public static class AnalyticsBackupCsv { public const string Version = ""0""; }'`n& '$Script' status -StateDir '$State'`nexit `$LASTEXITCODE`n", $Utf8NoBom)
  $staleRun = Invoke-Native 'powershell.exe' ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}"' -f $staleProbe)
  Check ($staleRun.Code -eq 1 -and $staleRun.Text -match "different copy of the CSV helper \(version '0'") 'an outdated helper loaded in the same session is refused' $staleRun

  # ----------------------------------------------------------------- 9. archive changed by hand
  Write-Host "`n9. Archive file changed by hand"
  $file04 = Get-DayPath '2026-10-04'
  $orig04 = [IO.File]::ReadAllBytes($file04)
  $lines04 = [IO.File]::ReadAllLines($file04); [IO.File]::AppendAllText($file04, $lines04[1] + "`n", $Utf8NoBom)
  $tampered = Get-FileHashText $file04
  $verify = Invoke-Backup 'verify'
  Check ($verify.Code -eq 1 -and $verify.Text -match 'FAIL 2026-10-04') 'verify detects the change' $verify
  $r12 = Insert-Event (Wib '2026-10-12 10:00:00')
  $damagedRun = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  Check ($damagedRun.Code -eq 4 -and $damagedRun.Text -match '2026-10-04 is missing or changed since it was written. It was NOT overwritten') 'run exits 4 and does not overwrite the changed file' $damagedRun
  Check ((Get-FileHashText $file04) -eq $tampered) 'changed file left exactly as it was'
  Check ((Get-CsvIds (Get-DayPath '2026-10-12')) -contains $r12) 'other days are still archived'
  $repair = Invoke-Backup 'repair' $null @{} '-Day 2026-10-04'
  Check ($repair.Code -eq 0) 'explicit repair exits 0' $repair
  $saved = @(Get-ChildItem (Join-Path $State 'data\repairs') -Recurse -File | Where-Object { $_.Name -match '^\d+-2026-10-04\.csv$' })
  Check ($saved.Count -eq 1 -and (Get-FileHashText $saved[0].FullName) -eq $tampered) 'repair saved the changed file before replacing it'
  Check ([Convert]::ToBase64String([IO.File]::ReadAllBytes($file04)) -eq [Convert]::ToBase64String($orig04)) 'repaired file equals the original content'
  Check ((Invoke-Backup 'verify').Code -eq 0) 'verify passes after repair'

  # ----------------------------------------------------------------- 10. archive file missing
  Write-Host "`n10. Archive file missing"
  $file06 = Get-DayPath '2026-10-06'
  Move-Item $file06 (Join-Path $Work 'moved-2026-10-06.csv')
  $missingRun = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  Check ($missingRun.Code -eq 4 -and -not (Test-Path $file06)) 'run exits 4 and does not recreate the missing file silently' $missingRun
  $repair06 = Invoke-Backup 'repair' $null @{} '-Day 2026-10-06'
  Check ($repair06.Code -eq 0 -and (Same-Ids (Get-CsvIds $file06) @($r7, $r8))) 'repair recreates the missing file from the database' $repair06
  # Missing file AND rows gone from the database: the .bak copy is used.
  $file01 = Get-DayPath '2026-10-01'
  $bakIds = Get-CsvIds ($file01 + '.bak')
  Move-Item $file01 (Join-Path $Work 'moved-2026-10-01.csv')
  Invoke-Owner "DELETE FROM analytics_events WHERE id IN ($r2, $r3);" | Out-Null
  $repair01 = Invoke-Backup 'repair' $null @{} '-Day 2026-10-01'
  $ids01 = Get-CsvIds $file01
  Check ($repair01.Code -eq 0 -and ($ids01 -contains $r2) -and ($ids01 -contains $r3) -and ($ids01 -contains $late1)) 'repair recovers rows deleted from the database from the .bak copy' $repair01
  Check (Same-Ids (@($bakIds) + @($late1)) $ids01) 'recovered file = .bak rows + rows still in the database'

  # ----------------------------------------------------------------- 11. checkpoint missing, rebuild from valid archive
  Write-Host "`n11. Checkpoint missing; rebuild from the local archive"
  $cpPath = Join-Path $State 'checkpoint.json'
  $cpBefore = Read-Checkpoint
  $hashes = Get-ArchiveHashes
  Move-Item $cpPath (Join-Path $Work 'saved-checkpoint.json')
  Move-Item ($cpPath + '.bak') (Join-Path $Work 'saved-checkpoint.json.bak')
  $noCp = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  Check ($noCp.Code -eq 1 -and $noCp.Text -match "Run 'rebuild-checkpoint' first" -and -not (Test-Path $cpPath)) 'run refuses without a checkpoint' $noCp
  Check (Same-Hashes $hashes (Get-ArchiveHashes)) 'refused run leaves the archive untouched'
  Set-BackupConfig 'analytics_backup' 'not-the-password'   # rebuild must not need the database
  $rebuild = Invoke-Backup 'rebuild-checkpoint'
  Check ($rebuild.Code -eq 0 -and $rebuild.Text -match 'No database was contacted') 'rebuild-checkpoint succeeds without database access' $rebuild
  $cpAfter = Read-Checkpoint
  $same = $cpAfter.archivedThroughDate -eq $cpBefore.archivedThroughDate -and $cpAfter.lastId -eq $cpBefore.lastId
  foreach ($p in $cpBefore.days.PSObject.Properties) {
    $n = $cpAfter.days.($p.Name)
    if (-not $n -or $n.sha256 -ne $p.Value.sha256 -or $n.rows -ne $p.Value.rows) { $same = $false }
  }
  Check $same 'rebuilt checkpoint matches every file checksum and row count'
  Check ((Invoke-Backup 'verify').Code -eq 0) 'verify passes with the rebuilt checkpoint'
  Set-BackupConfig 'analytics_backup' $ReadPw
  $afterRebuild = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  Check ($afterRebuild.Code -eq 0 -and (Same-Hashes $hashes (Get-ArchiveHashes))) 'next run reconciles with the database without changing the archive' $afterRebuild
  Check ((Invoke-Backup 'rebuild-checkpoint').Code -eq 1) 'rebuild refuses to replace an existing checkpoint without -Force'

  # ----------------------------------------------------------------- 12. rebuild with a damaged archive; moving to another computer
  Write-Host "`n12. Rebuild with damaged files; restore on another computer"
  $other = Join-Path $Work 'other-computer'
  New-Item -ItemType Directory $other | Out-Null
  Copy-Item (Join-Path $State 'data') (Join-Path $other 'data') -Recurse
  $bad08 = Get-DayPath '2026-10-08' $other
  $text08 = [IO.File]::ReadAllText($bad08)
  [IO.File]::WriteAllText($bad08, ($text08 -replace "`n(\d+),", "`nabc,"), $Utf8NoBom)
  Remove-Item (Get-DayPath '2026-10-09' $other)
  $badRebuild = Invoke-Backup 'rebuild-checkpoint' $null @{} '' $other
  Check ($badRebuild.Code -eq 1 -and $badRebuild.Text -match "2026-10-08: invalid id 'abc'" -and $badRebuild.Text -match '2026-10-09: file missing' -and $badRebuild.Text -match 'Manual action') 'rebuild stops and lists damaged and missing files' $badRebuild
  Check (-not (Test-Path (Join-Path $other 'checkpoint.json'))) 'no checkpoint is written from a damaged archive'
  Copy-Item (Get-DayPath '2026-10-08') $bad08 -Force
  Copy-Item (Get-DayPath '2026-10-09') (Get-DayPath '2026-10-09' $other)
  $goodRebuild = Invoke-Backup 'rebuild-checkpoint' $null @{} '' $other
  Check ($goodRebuild.Code -eq 0 -and (Invoke-Backup 'verify' $null @{} '' $other).Code -eq 0) 'restored copy rebuilds and verifies in a different folder' $goodRebuild

  # ----------------------------------------------------------------- 13. corrupt checkpoint
  Write-Host "`n13. Corrupt checkpoint"
  $cpText = [IO.File]::ReadAllText($cpPath)
  $hashes = Get-ArchiveHashes
  [IO.File]::WriteAllText($cpPath, '{ not json', $Utf8NoBom)
  $corrupt = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  Check ($corrupt.Code -eq 1 -and $corrupt.Text -match 'checkpoint.json is not valid JSON') 'corrupt checkpoint stops the run' $corrupt
  Check (Same-Hashes $hashes (Get-ArchiveHashes)) 'corrupt checkpoint leaves archives untouched'
  [IO.File]::WriteAllText($cpPath, $cpText, $Utf8NoBom)

  # ----------------------------------------------------------------- 14. security
  Write-Host "`n14. Read-only enforcement and secrets"
  $hashes = Get-ArchiveHashes
  Set-BackupConfig 'writer' $WritePw
  $w = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  Check ($w.Code -eq 2 -and $w.Text -match 'role can write to 1 table') 'role with INSERT is refused' $w
  Set-BackupConfig 'owner' $OwnerPw
  $o = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  Check ($o.Code -eq 2 -and $o.Text -match 'superuser') 'superuser is refused' $o
  Check (Same-Hashes $hashes (Get-ArchiveHashes)) 'refused runs write no archive files'
  Set-BackupConfig 'analytics_backup' 'wrong-password-value'
  $bad = Invoke-Backup 'check'
  Check ($bad.Code -eq 1 -and $bad.Text -match 'password authentication failed') 'wrong password fails clearly' $bad
  Set-BackupConfig 'analytics_backup' $ReadPw 'ep-example.neon.tech' 'disable'
  Check ((Invoke-Backup 'check').Text -match "sslMode 'disable' is only allowed") 'plaintext connection to a remote host is refused'
  Set-BackupConfig 'analytics_backup' $ReadPw
  $mutex = New-Object Threading.Mutex($false, 'Local\PortfolioAnalyticsBackup'); [void]$mutex.WaitOne()
  $busy = Invoke-Backup 'run' '2026-10-12T18:30:00Z'
  $busyRepair = Invoke-Backup 'repair' $null @{} '-Day all'
  $mutex.ReleaseMutex(); $mutex.Dispose()
  Check ($busy.Code -eq 3 -and $busyRepair.Code -eq 3) 'concurrent run or repair exits 3'
  $logs = (Get-ChildItem (Join-Path $State 'logs') -File | ForEach-Object { Get-Content -Raw $_.FullName }) -join "`n"
  $everything = $logs + $script:AllOutput.ToString()
  Check (-not ($everything.Contains($ReadPw) -or $everything.Contains($WritePw) -or $everything.Contains($OwnerPw))) 'no password appears in logs or output'
  Check ($everything -notmatch 'postgres(ql)?://') 'no connection string appears in logs or output'
  Check ((Get-Content -Raw (Join-Path $State 'credential.dpapi')) -notmatch [regex]::Escape($ReadPw)) 'credential file is encrypted'
  $config = Get-Content -Raw (Join-Path $State 'config.json')
  Check (-not $config.Contains($ReadPw) -and $config -notmatch 'password') 'config.json holds no password'

  # ----------------------------------------------------------------- 15. task management (test store, no real task)
  Write-Host "`n15. Task Scheduler commands (test store, real Task Scheduler untouched)"
  $name = 'Analytics Backup TEST (mock)'
  $realBefore = @(Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskName -eq $name }).Count
  $store = Join-Path $Work 'fake-tasks.json'
  $fake = @{ ANALYTICS_BACKUP_TEST_TASK_STORE = $store }
  $readTask = { $all = Get-Content -Raw $store | ConvertFrom-Json; if ($all.PSObject.Properties[$name]) { $all.$name } else { $null } }
  $hashes = Get-ArchiveHashes
  $cpBefore = [IO.File]::ReadAllText($cpPath)
  $install = Invoke-Backup 'install' $null $fake
  $task = & $readTask
  Check ($install.Code -eq 0 -and $null -ne $task -and $task.State -eq 'Disabled') 'install registers the task DISABLED by default' $install
  if ($null -eq $task) { throw 'Stopping: install did not register the test task.' }
  Check ($task.StartWhenAvailable -eq $true) 'task runs a missed schedule when the computer is available'
  Check ($task.MultipleInstances -eq 'IgnoreNew' -and $task.ExecutionTimeLimit -eq 'PT1H' -and $task.RestartCount -eq 3 -and $task.RestartInterval -eq 'PT30M') 'no overlapping runs; one hour limit; retries'
  $at = [DateTime]::Parse($task.StartBoundary)
  $wibAt = [TimeZoneInfo]::ConvertTime((New-Object DateTimeOffset $at), [TimeZoneInfo]::FindSystemTimeZoneById('SE Asia Standard Time'))
  Check ($task.TriggerClass -eq 'MSFT_TaskDailyTrigger' -and $task.DaysInterval -eq 1 -and $wibAt.Hour -eq 1 -and $wibAt.Minute -eq 0) 'daily trigger at 01:00 WIB'
  Check ($task.Execute -eq 'powershell.exe' -and $task.Arguments -match '-File ".+analytics-backup\.ps1" run -StateDir "' -and $task.LogonType -eq 'Interactive' -and $task.RunLevel -eq 'Limited') 'action runs the backup as the current user without elevation'
  Check ((Invoke-Backup 'install' $null $fake).Code -eq 1) 'install refuses to overwrite an existing task'
  Invoke-Backup 'enable' $null $fake | Out-Null
  Check ((& $readTask).State -eq 'Ready') 'enable turns the task on'
  Invoke-Backup 'disable' $null $fake | Out-Null
  Check ((& $readTask).State -eq 'Disabled') 'disable turns the task off'
  Invoke-Backup 'enable' $null $fake | Out-Null
  $status = Invoke-Backup 'status' $null $fake
  Check ($status.Text -match 'Archived     : through 2026-10-12' -and $status.Text -match "Task         : '$([regex]::Escape($name))' is Ready" -and $status.Text -match 'Damaged      : none') 'status shows checkpoint, damage, and task state' $status
  Invoke-Backup 'uninstall' $null $fake | Out-Null
  Check ($null -eq (& $readTask)) 'uninstall removes the task'
  Check ((Same-Hashes $hashes (Get-ArchiveHashes)) -and ([IO.File]::ReadAllText($cpPath) -eq $cpBefore)) 'install/enable/disable/uninstall leave archives and checkpoint untouched'
  $enabledInstall = Invoke-Native 'powershell.exe' ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" install -StateDir "{1}" -Enable' -f $Script, $State) $fake
  Check ((& $readTask).State -eq 'Ready') 'install -Enable registers the task enabled' $enabledInstall
  Check ((Invoke-Backup 'logs').Text -match 'Backup finished') 'logs command shows recent runs'
  $realAfter = @(Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskName -eq $name }).Count
  Check ($realBefore -eq 0 -and $realAfter -eq 0) 'no real scheduled task was created'
}
catch {
  $script:Failed++
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host $_.ScriptStackTrace
}
finally {
  if (Test-Path $Data) { Invoke-Native (Join-Path $PgBin 'pg_ctl.exe') ('-D "{0}" -m fast -w stop' -f $Data) | Out-Null }
  Remove-Item -LiteralPath $Work -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host ("`nResult: {0} passed, {1} failed. Temporary cluster removed: {2}" -f $script:Passed, $script:Failed, (-not (Test-Path $Work)))
}
if ($script:Failed -gt 0) { exit 1 } else { exit 0 }
