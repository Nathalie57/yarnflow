import React from 'react'
import Markdown from 'react-markdown'
import { normalizeFlowMarkdown } from '../utils/flowMarkdown.js'

// CommonMark traite les entités, échappements et listes. Aucun HTML brut exécuté.
export default function FlowMarkdown({ text }) {
  return React.createElement('div', {
    className: 'space-y-2 break-words [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:my-1 [&_p]:my-1 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_a]:underline [&_pre]:overflow-x-auto',
  }, React.createElement(Markdown, { skipHtml: true }, normalizeFlowMarkdown(text)))
}
