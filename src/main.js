const ops: {
	"move": function(path, args) { path.moveTo(args[0], args[1]); },
	"line": function(path, args) { path.lineTo(args[0], args[1]); },
	"arc": function(path, args) { path.arc(args[0], args[1], args[2], args[3], args[4], false); },
	"ctarc": function(path, args) { path.arc(args[0], args[1], args[2], args[3], args[4], true); },
	"PI": function() {return Math.PI; }
}

function parsepath(data) {
	var path = (typeof window !== 'undefined') ? new Path2D() : null;
	if (!path) throw new TypeError('Nodejs is unsupported for now!');
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