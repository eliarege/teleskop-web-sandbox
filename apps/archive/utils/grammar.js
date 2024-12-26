import moo from 'moo'

function id(x) {
  return x[0]
}

const lexer = moo.compile({
  ws: /[ \t]+/,
  lparen: '(',
  rparen: ')',
  add_sub: /[+-]/,
  mul_div: /[*/]/,
  number: { match: /\d+(?:\.\d+)?/, value: v => Number.parseFloat(v) },
  variable: /[a-zA-Z0-9çÇğĞıİöÖşŞüÜ._<>\\]+(?:\s*[a-zA-Z0-9çÇğĞıİöÖşŞüÜ._<>\\]+)*/,
})

const grammar = {
  Lexer: lexer,
  ParserRules: [
    { name: 'main', symbols: ['_', 'AS', '_'], postprocess: d => d[1] },
    { name: 'P', symbols: [(lexer.has('lparen') ? { type: 'lparen' } : lparen), '_', 'AS', '_', (lexer.has('rparen') ? { type: 'rparen' } : rparen)], postprocess: d => d[2] },
    { name: 'P', symbols: ['T'], postprocess: id },
    { name: 'P', symbols: ['WD'], postprocess: id },
    { name: 'AS', symbols: ['AS', '_', (lexer.has('add_sub') ? { type: 'add_sub' } : add_sub), '_', 'MD'], postprocess: d => ({ type: 'operator', left: d[0], operator: d[2].value, right: d[4] }) },
    { name: 'AS', symbols: ['MD'], postprocess: id },
    { name: 'MD', symbols: ['MD', '_', (lexer.has('mul_div') ? { type: 'mul_div' } : mul_div), '_', 'P'], postprocess: d => ({ type: 'operator', left: d[0], operator: d[2].value, right: d[4] }) },
    { name: 'MD', symbols: ['P'], postprocess: id },
    { name: 'WD', symbols: [(lexer.has('variable') ? { type: 'variable' } : variable)], postprocess: d => ({ type: 'variable', value: d[0].value }) },
    { name: 'T', symbols: [(lexer.has('number') ? { type: 'number' } : number)], postprocess: d => ({ type: 'number', value: d[0].value }) },
    { name: '_$ebnf$1', symbols: [(lexer.has('ws') ? { type: 'ws' } : ws)], postprocess: id },
    { name: '_$ebnf$1', symbols: [], postprocess(_) {
      return null
    } },
    { name: '_', symbols: ['_$ebnf$1'], postprocess: () => null },
  ],
  ParserStart: 'main',
}

export { grammar }
