/** Builds CSV text (RFC 4180 quoting) from a header row and data rows. */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => {
    const text = String(cell)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }).join(',')).join('\n')
}

/** Saves CSV text as a file in the browser (no server involved). */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
