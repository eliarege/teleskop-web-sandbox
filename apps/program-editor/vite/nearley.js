import { readFileSync } from 'node:fs'
import { Grammar, Parser } from 'nearley'
import compile from 'nearley/lib/compile'
import generate from 'nearley/lib/generate'
import nearleyGrammar from 'nearley/lib/nearley-language-bootstrapped'

const grammar = Grammar.fromCompiled(nearleyGrammar)

/**
 * Importable nearley grammar files
 */
export function Nearley() {
  return {
    name: 'vite-plugin-nearley',
    load(id) {
      if (!/\.ne$/.test(id))
        return

      const code = readFileSync(id, 'utf-8')

      // Parse the grammar source into an AST
      const parser = new Parser(grammar)
      parser.feed(code)
      const ast = parser.results[0] // TODO check for errors

      // Compile the AST into a set of rules
      const info = compile(ast, {})
      // Generate JavaScript code from the rules
      const output = generate.esmodule(info, 'grammar')
      return output
    },
  }
}

export default Nearley
