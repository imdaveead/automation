const evaluate = require('expr-eval').Parser.evaluate;
const { addHook } = require('../api');

addHook('math expression eval', /!=(.*) *$/, (m, expr) => m.channel.send(`\`=${evaluate(expr, {})}\``));
