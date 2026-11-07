import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
// The official TypeScript 6 API package supports AST consumers alongside tsc 7.
import ts from 'typescript'

// Read the authored data with the TypeScript parser, without evaluating application modules.
export function parseConstant(file, text, name) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  let initializer
  function walk(node) { if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) initializer = node.initializer; ts.forEachChild(node, walk) }
  walk(source)
  function value(node) {
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return value(node.expression)
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(value)
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(prop => [prop.name.text, value(prop.initializer)]))
    if (ts.isIdentifier(node)) return node.text
    throw Error(`Unsupported content expression in ${file}`)
  }
  assert.ok(initializer, `${name} missing from ${file}`)
  return value(initializer)
}
export async function readConstant(file, name) {
  return parseConstant(file, await readFile(file, 'utf8'), name)
}
