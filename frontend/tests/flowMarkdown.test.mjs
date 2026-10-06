import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import FlowMarkdown from '../src/components/FlowMarkdown.js'
import { normalizeFlowMarkdown } from '../src/utils/flowMarkdown.js'

const render = text => renderToStaticMarkup(React.createElement(FlowMarkdown, { text }))

test('CommonMark renders entities, emphasis and properly nested ordered/unordered lists', () => {
  const html = render('1. **Rang envers**\n   - Tricoter &amp; tourner\n   - Bordure\n2. Rang endroit')
  assert.match(html, /<ol>/)
  assert.match(html, /<ul>/)
  assert.match(html, /<strong>Rang envers<\/strong>/)
  assert.match(html, /Tricoter &amp; tourner/)
  assert.doesNotMatch(html, /&amp;amp;/)
})

test('legacy encoded indentation and escaped numbering become real lists', () => {
  const text = '1\\. **Rang envers**\n&#x20;   \\* Tricoter\n&#x20;   \\* Tourner\n2\\. Rang endroit'
  const html = render(text)
  assert.match(html, /<ol>/)
  assert.match(html, /<ul>/)
  assert.match(html, /<li>Tricoter<\/li>/)
  assert.doesNotMatch(html, /&#x20;|&amp;#x20;|\\\./)
})

test('literal inline escapes and code remain literal', () => {
  const text = 'Répéter \\* deux fois ; `1\\.`\n\n```text\n1\\. Exemple\n&#x20; \\* Exemple\n```'
  const normalized = normalizeFlowMarkdown(text)
  assert.equal(normalized, text)
  assert.match(render(text), /Répéter \* deux fois/)
  assert.doesNotMatch(render(text), /<ol>/)
  const indented = '    1\\. Code indenté'
  assert.equal(normalizeFlowMarkdown(indented), indented)
})

test('HTML and unsafe URLs are not executed or rendered as active content', () => {
  const html = render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[piège](javascript:alert%281%29)')
  assert.doesNotMatch(html, /<script|<img|onerror=|href="javascript:/)
})
