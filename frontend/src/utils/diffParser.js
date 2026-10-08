/**
 * Unified Diff Parser for GitHub-style Code Diff Viewer.
 * Parses raw unified diff string into files and line objects with
 * accurate oldLine / newLine line numbers for inline issue placement.
 */

export function parseUnifiedDiff(rawDiff) {
  if (!rawDiff || typeof rawDiff !== 'string') {
    return []
  }

  const lines = rawDiff.split(/\r?\n/)
  const files = []
  let currentFile = null
  let currentHunk = null
  let oldLine = 0
  let newLine = 0

  const hunkRegex = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/
  const fileHeaderOld = /^--- (?:a\/)?(.*)$/
  const fileHeaderNew = /^\+\+\+ (?:b\/)?(.*)$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip diff index / git command lines
    if (line.startsWith('diff --git') || line.startsWith('index ')) {
      continue
    }

    // New file header
    const newMatch = line.match(fileHeaderNew)
    if (newMatch) {
      const filePath = newMatch[1]
      currentFile = {
        path: filePath,
        filename: filePath.split('/').pop(),
        hunks: [],
      }
      files.push(currentFile)
      continue
    }

    if (line.match(fileHeaderOld)) {
      continue
    }

    // Hunk header @@ -x,y +a,b @@
    const hunkMatch = line.match(hunkRegex)
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10)
      newLine = parseInt(hunkMatch[3], 10)
      currentHunk = {
        header: line,
        oldStart: oldLine,
        newStart: newLine,
        lines: [],
      }
      if (currentFile) {
        currentFile.hunks.push(currentHunk)
      }
      continue
    }

    if (!currentHunk) {
      continue
    }

    // Diff line types
    if (line.startsWith('+')) {
      currentHunk.lines.push({
        type: 'add',
        oldLineNo: null,
        newLineNo: newLine,
        content: line.substring(1),
        raw: line,
      })
      newLine++
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        type: 'del',
        oldLineNo: oldLine,
        newLineNo: null,
        content: line.substring(1),
        raw: line,
      })
      oldLine++
    } else {
      // Context line (starts with space or empty)
      const content = line.startsWith(' ') ? line.substring(1) : line
      currentHunk.lines.push({
        type: 'normal',
        oldLineNo: oldLine,
        newLineNo: newLine,
        content,
        raw: line,
      })
      oldLine++
      newLine++
    }
  }

  return files
}

/**
 * Extracts language tag from file path
 */
export function getLanguageFromFile(filePath = '') {
  const ext = filePath.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'py': return 'Python'
    case 'js': return 'JavaScript'
    case 'jsx': return 'React JSX'
    case 'ts': return 'TypeScript'
    case 'tsx': return 'React TSX'
    case 'json': return 'JSON'
    case 'html': return 'HTML'
    case 'css': return 'CSS'
    case 'sql': return 'SQL'
    case 'yml':
    case 'yaml': return 'YAML'
    case 'md': return 'Markdown'
    default: return ext?.toUpperCase() || 'Text'
  }
}
