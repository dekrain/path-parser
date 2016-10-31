const ops = {
	"move": function(path, args) { path.moveTo(args[0], args[1]); },
	"line": function(path, args) { path.lineTo(args[0], args[1]); },
	"arc": function(path, args) { path.arc(args[0], args[1], args[2], args[3], args[4], false); },
	"ctarc": function(path, args) { path.arc(args[0], args[1], args[2], args[3], args[4], true); },
	"PI": function() { return Math.PI; }
}

function parsepath(data) {
	var path = (typeof window !== 'undefined') ? new Path2D() : null;
	if (!path) throw new TypeError('Nodejs is unsupported for now!');

	var lines = data.split(/[\r\n|\n]/);
	lines.forEach(function(line){
		line = line.trim();
		var op, args = []; if ((line.length < 1) || (line[0] === '#')) return;
		line.split('#')[0].trim().split(' ').forEach(function(word,idx){
			if (idx === 0) op = word;
			else {
				var exp = [!(/[0-9]/.test(word[0])), ((word[0] === '(') && (word[word.length-1] === ')'))];
				if (exp[1]) word = word.slice(1,-1);
				args.push([exp[0]||exp[1], word]);
			};
		});
		if (!(op in ops)) ReferenceError(`Undefined operator: ${op}`);
		args = args.map(function(arg){
			if (!arg[0]) return arg[1];
			else {
				var result = 0, parts, co;
				parts = arg[1].split(/[+|-|*|/|%]/).map(function(o){
					if (/[0-9]/.test(o[0])) return o;
					else if (o in ops) return ops[o](path, []);
					else throw new ReferenceError(`Undefined operator: ${o}`);
				});
				arg[1].split('').filter(function(o){return '+-*/%'.split('').indexOf(o) > -1;}).forEach(function(o,i){
					parts.splice(i*2+1,0,o);
				});
				parts.forEach(function(v,i){
					if (i === 0) result = v;
					else if (i%2 === 1) co = v;
					else result =
						(co === '+') ? result + v :
						(co === '-') ? result - v :
						(co === '*') ? result * v :
						(co === '/') ? result / v :
						(co === '%') ? result % v :
						result; // For other checks
				});
				return result;
			}
		});
		return ops[op](path, args);
	});
	return path;
}

function open(filename) {
	var data = require('fs').readFileSync(filename, {encoding: 'UTF-8'});
	return parsepath(data);
};

if (typeof module !== 'undefined') {
	parsepath.open = open;
	module.exports = parsepath;
} else if (typeof window !== 'undefined') {
	window.Path2DParser = parsepath; // Open method is only for nodejs module
}