import fs from 'node:fs'
import path from 'node:path'

export default class SecurityReporter {
  constructor() { this.failures = [] }

  onTestEnd(test, result) {
    if (result.status === test.expectedStatus) return
    const annotations = Object.fromEntries(test.annotations.map(item => [item.type, item.description]))
    this.failures.push({
      test: test.titlePath().join(' > '),
      endpoint: annotations.endpoint || 'See test title',
      expected: annotations.expected || test.expectedStatus,
      actual: result.error?.message?.split('\n')[0] || result.status,
      risk: annotations.risk || 'Unclassified',
      rootCause: annotations.root_cause || 'Requires investigation',
      artifacts: result.attachments.map(item => item.path).filter(Boolean),
    })
  }

  onEnd() {
    const directory = path.resolve('test-results/security')
    fs.mkdirSync(directory, { recursive: true })
    const lines = ['# Security regression failures', '']
    if (!this.failures.length) lines.push('No security expectation failures were detected.')
    for (const failure of this.failures) {
      lines.push(`## ${failure.test}`, '')
      lines.push(`- Endpoint/route: ${failure.endpoint}`)
      lines.push(`- Expected: ${failure.expected}`)
      lines.push(`- Actual: ${failure.actual}`)
      lines.push(`- Risk: ${failure.risk}`)
      lines.push(`- Likely root cause: ${failure.rootCause}`)
      lines.push(`- Artifacts: ${failure.artifacts.join(', ') || 'No artifact path emitted'}`, '')
    }
    fs.writeFileSync(path.join(directory, 'failures.md'), lines.join('\n'))
  }
}
