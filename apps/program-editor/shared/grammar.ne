@{%
import moo from 'moo'

const lexer = moo.compile({
  ws: /[ \t]+/,
  lparen: '(',
  rparen: ')',
  add_sub: /[+-]/,
  mul_div: /[*/]/,
  number: { match: /\d+(?:\.\d+)?/, value: v => parseFloat(v) },
  variable: /[a-zA-Z0-9çÇğĞıİöÖşŞüÜ._<>\\]+(?:\s*[a-zA-Z0-9çÇğĞıİöÖşŞüÜ._<>\\]+)*/,
})

const range = /[\u{00A0}-\u{024F}]/u
%}

@lexer lexer

main -> _ AS _      {% (d) => d[1] %}

# Parentheses
P -> %lparen _ AS _ %rparen {% d => d[2] %}
   | T                      {% id %}
   | WD                     {% id %}

# Addition and subtraction
AS -> AS _ %add_sub _ MD {% (d) => ({ type: "operator", left: d[0], operator: d[2].value, right: d[4] }) %}
    | MD                 {% id %}

# Multiplication and division
MD -> MD _ %mul_div _ P {% (d) => ({ type: "operator", left: d[0], operator: d[2].value, right: d[4] }) %}
    | P                 {% id %}

# Word
WD -> %variable {% (d) => ({ type: "variable", value: d[0].value }) %}

# Number
T -> %number {% (d) => ({ type: "number", value: d[0].value }) %}

# Whitespace
_ -> %ws:? {% () => null %}

# input value
# (Kilo*(AK Boya Orani+Flotte Duzeltme Oran-2.7)-(Birinci Soda+Ikinci Soda+Boya+Tuz+Bikarbonat+Alkali+Sulfat+(Dozaj Sayisi*Online Gonderim Suyu)))
