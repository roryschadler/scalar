#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

/**
 * Visual Diff Helper for GitHub PR Integration
 * Processes Playwright visual test results and prepares them for PR comments
 */

const TEST_RESULTS_DIR = './test-results'
const OUTPUT_DIR = './visual-diffs'

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function findVisualDiffs() {
  const diffs = []

  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    console.log('No test results directory found')
    return diffs
  }

  const walkDir = (dir, prefix = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(prefix, entry.name)

      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath)
      } else if (entry.name.includes('-diff.png') || entry.name.includes('-actual.png')) {
        const testName = entry.name.replace(/-diff\.png$/, '').replace(/-actual\.png$/, '')

        const existingDiff = diffs.find((d) => d.testName === testName)
        if (existingDiff) {
          if (entry.name.includes('-diff.png')) {
            existingDiff.diffPath = fullPath
          } else if (entry.name.includes('-actual.png')) {
            existingDiff.actualPath = fullPath
          }
        } else {
          diffs.push({
            testName,
            diffPath: entry.name.includes('-diff.png') ? fullPath : null,
            actualPath: entry.name.includes('-actual.png') ? fullPath : null,
            expectedPath: null, // We'll find this from snapshots
            relativePath: path.dirname(relativePath),
          })
        }
      }
    }
  }

  walkDir(TEST_RESULTS_DIR)

  // Find expected images from test snapshots
  const snapshotDirs = ['./tests']
  for (const diff of diffs) {
    for (const snapshotDir of snapshotDirs) {
      const expectedFile = `${diff.testName}-linux.png`
      const expectedPath = findFileInDir(snapshotDir, expectedFile)
      if (expectedPath) {
        diff.expectedPath = expectedPath
        break
      }
    }
  }

  return diffs.filter((d) => d.diffPath || d.actualPath)
}

function findFileInDir(dir, filename) {
  if (!fs.existsSync(dir)) {
    return null
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      const found = findFileInDir(fullPath, filename)
      if (found) {
        return found
      }
    } else if (entry.name === filename) {
      return fullPath
    }
  }

  return null
}

function copyVisualDiffs(diffs) {
  ensureDirectoryExists(OUTPUT_DIR)

  const processedDiffs = []

  for (const diff of diffs) {
    const outputSubDir = path.join(OUTPUT_DIR, diff.testName)
    ensureDirectoryExists(outputSubDir)

    const processedDiff = {
      testName: diff.testName,
      files: {},
    }

    // Copy expected (baseline) image
    if (diff.expectedPath && fs.existsSync(diff.expectedPath)) {
      const expectedOutput = path.join(outputSubDir, 'expected.png')
      fs.copyFileSync(diff.expectedPath, expectedOutput)
      processedDiff.files.expected = expectedOutput
    }

    // Copy actual (current) image
    if (diff.actualPath && fs.existsSync(diff.actualPath)) {
      const actualOutput = path.join(outputSubDir, 'actual.png')
      fs.copyFileSync(diff.actualPath, actualOutput)
      processedDiff.files.actual = actualOutput
    }

    // Copy diff image
    if (diff.diffPath && fs.existsSync(diff.diffPath)) {
      const diffOutput = path.join(outputSubDir, 'diff.png')
      fs.copyFileSync(diff.diffPath, diffOutput)
      processedDiff.files.diff = diffOutput
    }

    processedDiffs.push(processedDiff)
  }

  return processedDiffs
}

function generateMarkdownReport(diffs) {
  let markdown = '## 📸 Visual Regression Test Results\n\n'

  if (diffs.length === 0) {
    markdown += '✅ No visual differences detected.\n'
    return markdown
  }

  markdown += `🔍 **${diffs.length} visual difference(s) detected**\n\n`
  markdown += '### Review Changes\n\n'
  markdown += 'Please review the visual differences below. If the changes are intentional:\n\n'
  markdown += '1. **Approve changes**: Comment `@scalar-bot approve-visuals` on this PR\n'
  markdown += '2. **Reject changes**: The current snapshots will be kept\n\n'
  markdown += '---\n\n'

  for (const diff of diffs) {
    markdown += `### ${diff.testName}\n\n`
    markdown += '<details>\n'
    markdown += '<summary>View comparison</summary>\n\n'
    markdown += '<table>\n'
    markdown += '<tr>\n'
    markdown += '<th>Expected (Baseline)</th>\n'
    markdown += '<th>Actual (Current)</th>\n'
    markdown += '<th>Difference</th>\n'
    markdown += '</tr>\n'
    markdown += '<tr>\n'

    // Use artifact URLs (these will be replaced by the GitHub Action)
    const artifactBase = `${process.env.ARTIFACT_URL}/visual-diffs`

    if (diff.files.expected) {
      markdown += `<td><img src="${artifactBase}/${diff.testName}/expected.png" alt="Expected" style="max-width: 300px;"/></td>\n`
    } else {
      markdown += '<td>No baseline found</td>\n'
    }

    if (diff.files.actual) {
      markdown += `<td><img src="${artifactBase}/${diff.testName}/actual.png" alt="Actual" style="max-width: 300px;"/></td>\n`
    } else {
      markdown += '<td>No current image</td>\n'
    }

    if (diff.files.diff) {
      markdown += `<td><img src="${artifactBase}/${diff.testName}/diff.png" alt="Diff" style="max-width: 300px;"/></td>\n`
    } else {
      markdown += '<td>No diff available</td>\n'
    }

    markdown += '</tr>\n'
    markdown += '</table>\n\n'
    markdown += '</details>\n\n'
  }

  markdown += '---\n\n'
  markdown += '<details>\n'
  markdown += '<summary>🤖 How to approve changes</summary>\n\n'
  markdown += '1. Review the visual differences above\n'
  markdown += '2. If changes look correct, comment: `@scalar-bot approve-visuals`\n'
  markdown += '3. The bot will automatically update the snapshots and push a commit\n'
  markdown += '4. If changes look incorrect, fix the code and push a new commit\n\n'
  markdown += '</details>\n'

  return markdown
}

function main() {
  console.log('🔍 Searching for visual differences...')

  const diffs = findVisualDiffs()
  console.log(`Found ${diffs.length} visual differences`)

  if (diffs.length === 0) {
    // Create empty report
    const markdown = generateMarkdownReport([])
    fs.writeFileSync('./visual-diff-report.md', markdown)
    console.log('✅ No visual differences found')
    return
  }

  console.log('📋 Processing visual differences...')
  const processedDiffs = copyVisualDiffs(diffs)

  console.log('📝 Generating markdown report...')
  const markdown = generateMarkdownReport(processedDiffs)

  // Write report
  fs.writeFileSync('./visual-diff-report.md', markdown)

  // Write JSON summary for GitHub Actions
  fs.writeFileSync(
    './visual-diff-summary.json',
    JSON.stringify(
      {
        hasDifferences: processedDiffs.length > 0,
        count: processedDiffs.length,
        tests: processedDiffs.map((d) => d.testName),
      },
      null,
      2,
    ),
  )

  console.log(`✅ Generated report for ${processedDiffs.length} visual differences`)
  console.log('📄 Reports saved: visual-diff-report.md, visual-diff-summary.json')
}

if (require.main === module) {
  main()
}

module.exports = {
  findVisualDiffs,
  copyVisualDiffs,
  generateMarkdownReport,
}
