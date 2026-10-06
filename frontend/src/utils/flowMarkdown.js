// Compatibilité avec les anciennes réponses : réparer seulement les préfixes
// de listes et l’indentation encodée. Le parseur CommonMark fait tout le reste.
export function normalizeFlowMarkdown(text) {
  let fence = null
  return String(text ?? '').split('\n').map(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = marker[1]
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null
      return line
    }
    if (fence) return line
    const decoded = line.replace(/^(?:(?:&#x20;|&#32;|&nbsp;|&#160;)|[ \t])+/gi,
      prefix => prefix.replace(/&#x20;|&#32;|&nbsp;|&#160;/gi, ' '))
    // Ne pas transformer du code indenté ; les anciennes indentations encodées
    // sont, elles, réparées pour retrouver les sous-listes.
    if (decoded === line && /^(?: {4}|\t)/.test(line)) return line
    return decoded.replace(/^(\s*)(\d+)\\\.(\s)/, '$1$2.$3')
      .replace(/^(\s*)\\([*-])(\s)/, '$1$2$3')
  }).join('\n')
}
