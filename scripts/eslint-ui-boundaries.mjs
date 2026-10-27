import path from 'node:path'

// Resolve paths instead of matching '../' depth, including lazy imports.
export const uiBoundaries = {
  meta: { type: 'problem', schema: [], messages: { boundary: '{{from}} cannot import {{to}}. See docs/UI-ARCHITECTURE.md.' } },
  create(context) {
    const filename = context.filename.replaceAll('\\', '/')
    const source = filename.split('/src/').at(-1)
    if (/\.(test|spec)\.[tj]sx?$/.test(source)) return {}
    const check = node => {
      const value = node.source?.value
      if (typeof value !== 'string') return
      const target = value.startsWith('.') ? path.resolve(path.dirname(filename), value).replaceAll('\\', '/').split('/src/').at(-1) : value
      const ui = /^(app|views|features|ui)\//
      const blocked = source.startsWith('ui/')
        ? /^(app|views|features|domain)\//.test(target) || (target.startsWith('lib/') && target !== 'lib/i18n') || /^(firebase|@tauri-apps)(\/|$)/.test(target)
        : source.startsWith('domain/')
          ? ui.test(target) || target.startsWith('lib/')
          : source.startsWith('lib/')
            ? ui.test(target)
            : source.startsWith('features/')
              ? /^(app|views)\//.test(target)
              : source.startsWith('views/') && target.startsWith('app/')
      if (blocked) context.report({ node, messageId: 'boundary', data: { from: source, to: target } })
    }
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check }
  },
}
