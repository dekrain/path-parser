// This is token-based version for this parser. Later, this'll be main version of parser.

(() => {
	
const ops = {
	'move': (path, args) => {path.moveTo(args[0], args[1])},
	'line': (path, args) => {path.lineTo(args[0], args[1])},
	'arc': (path, args) => {path.arc(args[0], args[1], args[2], args[3], args[4], false)},
	'ctarc': (path, args) => {path.arc(args[0], args[1], args[2], args[3], args[4], true)},
	'PI': () => Math.PI,
	'degress': () => Math.PI / 180
}

// Errors
const errs = {
	'inv-char': (line, col, ch) => new SyntaxError('Invalid character at: '+line+':'+col+' ['+ch+']'),
	'miss-exp-open': () => new SyntaxError('Missing open bracket!'),
	'miss-exp-close': () => new SyntaxError('Missing close bracket!'),
	'miss-cmd': (line, col) => new SyntaxError('Missing command literal at: '+line+':'+col),
	'multi-pts': (line, col) => new SyntaxError('Multiple points at: '+line+':'+col)
}

// Regular expressions
const reg_exps = {
	'whitechar': /\s/,
	'letter': /[a-z]/i,
	'digit': /[0-9.]/,
	'id': /[a-z0-9_\$]/i,
	'id_start': /[a-z_\$]/i,
	'op': /[\+\-\*\/\%]/,
	'after_sym': /[\+\-\*\/\%\s\(\)]/
}

// Colors for syntax-hi
const colors = {
	'paren': '\x1b[36m',
	'number': '\x1b[33m',
	'identifier': '\x1b[34m',
	'operator': '\x1b[35m',
	'comment': '\x1b[32m',
	'reset': '\x1b[0m'
}

function info(msg, method) {
	console[method || 'log'](`[${(info.caller && info.caller.name) || '<anonymous>'}] ${msg}`)
}

function tokenizer(data, line) {
	var tokens = []
	var pc = 0
	var level = 0
	var cmd_found = false
	while (pc < data.length) {
		let ch = data[pc]
		
		if (reg_exps.whitechar.test(ch)) {
			pc++
			continue
		} else if (ch === '#') {
			break
		} else if (reg_exps.id_start.test(ch)) {
			let id = ''
			while (ch && reg_exps.id.test(ch)) {
				id += ch
				ch = data[++pc]
			}
			if (ch && !reg_exps.after_sym.test(ch)) {
				throw errs['inv-char'](line, pc, ch)
			}
			tokens.push({ type: 'identifier', value: id })
			if (!cmd_found) cmd_found = true
		} else if (!cmd_found) {
			throw errs['miss-cmd'](line, pc)
		} else if (reg_exps.digit.test(ch)) {
			let num = ''
			let point = false
			while (ch && reg_exps.digit.test(ch)) {
				if (ch === '.') {
					if (point) {
						throw errs['multi-points'](line, pc)
					} else {
						point = true
					}
				}
				num += ch
				ch = data[++pc]
			}
			if (ch && !reg_exps.after_sym.test(ch)) {
				throw errs['inv-char'](line, pc, ch)
			}
			tokens.push({ type: 'number', value: num })
		} else if (ch === '(' || ch === ')') {
			if (ch === '(') {
				level++
			} else {
				level--
				if (level < 0) {
					throw errs['miss-exp-open']()
				}
			}
			tokens.push({ type: 'paren', value: ch })
			pc++
		} else if (reg_exps.op.test(ch)) {
			tokens.push({ type: 'operator', value: ch })
			pc++
		} else {
			throw errs['inv-char'](line, pc, ch)
		}
	}
	if (level > 0) {
		throw errs['miss-exp-close']()
	}
	return tokens
}
function parser(tokenss, inline) {
	var ast = {
		type: 'program',
		body: []
	}
	var tokens
	var pc
	function walk() {
		let token = tokens[pc]
		if (token.type === 'number'/* || token.type === 'string'*/) {
			if (++pc === tokens.length || tokens[pc].type !== 'operator') {
				return {
					type: token.type,
					value: token.value
				}
			}
		} else if (token.type === 'operator') {
			var name = token.value
			var x = tokens[pc-1]
			var y = tokens[++pc]
			pc++
			return {
				type: 'operator',
				name: name,
				args: parser([[x,y]], true).body
			}
		} else if (token.type === 'identifier') {
			let args = []
			let name = token.value
			if (!inline && pc === 0) {
				pc++
				while (pc < tokens.length) {
					args.push(walk())
				}
			} else pc++
			return {
				type: 'identifier',
				name: name,
				args: args
			}
		} else if (token.type === 'paren') {
			if (token.value !== '(') {
				throw new TypeError('Unexpected character ['+token.value+'] !')
			}
			let body = []
			token = tokens[++pc]
			while (pc < tokens.length && (token.type !== 'paren' || token.value !== ')')) {
				body.push(walk())
				token = tokens[pc]
			}
			if (token.type !== 'paren' || token.value !== ')') {
				throw new TypeError('Unexpected end of input!')
			}
			pc++
			return {
				type: 'expression',
				body: body[body.length-1]
			}
		} else {
			throw new TypeError('Unexpected token '+JSON.stringify(token)+' !')
		}
	}
	
	tokenss.forEach( (t,i) => {
		tokens = t
		pc = 0
		while (pc < tokens.length) {
			ast.body.push(walk())
		}
	})
	
	return ast
}
function run(ast) {
	var path = (typeof window !== 'undefined') && (typeof Path2D === 'function') && new Path2D();
	if (!path) path = {
		__noPath2D: true,
		source: [],
		moveTo: (x, y) => {path.source.push('ctx.moveTo('+x+','+y+');')},
		lineTo: (x, y) => {path.source.push('ctx.lineTo('+x+','+y+');')},
		arc: (x, y, r, sa, ea, ac) => {path.source.push('ctx.arc('+x+','+y+','+r+','+sa+','+ea+','+ac+');')},
		compile: () => {return Function('ctx',path.source.join('\n'))}
	};
	
	function singleRun(node) {
		if (node.type === 'program') {
			node.body.forEach(singleRun)
			return path.__noPath2D ? path.compile() : path
		} else if (node.type === 'identifier') {
			if (!(node.name in ops)) {
				throw new TypeError('No opcode for ['+node.name+'] !')
			}
			let result = ops[node.name].call(null, path, node.args.map(singleRun))
			return result
		} else if (node.type === 'number') {
			return parseFloat(node.value)
		} else if (node.type === 'operator') {
			if ('+-*/%'.split('').indexOf(node.name) === -1) {
				throw new TypeError('Wrong operator ['+node.name+'] !')
			}
			let a = singleRun(node.args[0])
			let b = singleRun(node.args[1])
			if (!isFinite(a) || !isFinite(b)) {
				throw new TypeError('Wrong operands!')
			}
			return {'+':(a,b)=>a+b,'-':(a,b)=>a-b,'*':(a,b)=>a*b,'/':(a,b)=>a/b,'%':(a,b)=>a%b}[node.name](a,b)
		} else if (node.type === 'expression') {
			return singleRun(node.body)
		} else {
			throw new TypeError('Invalid syntax node!')
		}
	}
	
	return singleRun(ast)
}

function parsepath(data, more) {
	var tokens = [], ast, result
	try {
		data.split('\n').forEach((d,l)=>{tokens.push(tokenizer(d,l+1))}) // Tokenize code
		ast = parser(tokens) // Parse tokens to get AST
		result = run(ast) // Run formatted code
	} catch(e) { console.error(e) }
	return more ? {tokens: tokens, ast: ast, result: result} : result
}

function open(filename) {
	const data = require('fs').readFileSync(filename, {encoding: 'UTF-8'})
	return parsepath(data)
}

// For syntax highlightning purpose; no syntax checks
function tokenize_els(data) {
	var tokens = []
	var pc = 0
	while (pc < data.length) {
		let ch = data[pc]
		
		if (reg_exps.whitechar.test(ch)) {
			pc++
			continue
		} else if (ch === '#') {
			tokens.push({ type: 'comment', start: pc, length: data.length-pc})
			break
		} else if (reg_exps.id_start.test(ch)) {
			let start = pc
			let len = 0
			while (ch && reg_exps.id.test(ch)) {
				len++
				ch = data[++pc]
			}
			tokens.push({ type: 'identifier', start: start, length: len })
		} else if (reg_exps.digit.test(ch)) {
			let start = pc
			let len = 0
			while (ch && reg_exps.digit.test(ch)) {
				len++
				ch = data[++pc]
			}
			tokens.push({ type: 'number', start: start, length: len })
		} else if (ch === '(' || ch === ')') {
			tokens.push({ type: 'paren', start: pc++, length: 1 })
		} else if (reg_exps.op.test(ch)) {
			tokens.push({ type: 'operator', start: pc++, length: 1 })
		} else pc++
	}
	return tokens
}

// Highlight syntax
function format(data) {
	var lines = data.split('\n')
	var tokens = lines.map(l=>tokenize_els(l))
	var list = data.split('')
	var offset = 0
	tokens.forEach((tks,i) => {
		tks.forEach(tk => {
			var start = tk.start + offset
			var end = start + tk.length - 1
			var color = colors[tk.type]
			list[start] = color + list[start]
			list[end] += colors.reset
		})
		offset += lines[i].length + 1
	})
	return list.join('')
}

parsepath.tokenizer = tokenizer
parsepath.parser = parser
parsepath.run = run

parsepath.tokenize_els = tokenize_els

if (typeof module !== 'undefined') {
	parsepath.open = open
	parsepath.format = format
	module.exports = parsepath
} else if (typeof window !== 'undefined') {
	window.Path2DParser = parsepath // Open method is only for nodejs module
}

})()
