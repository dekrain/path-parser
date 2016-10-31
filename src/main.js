function parsepath(data) {
	// @TODO
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