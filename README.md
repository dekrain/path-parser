# Path2D Parser
A parser for HTML5 Path2D Canvas object.
# Installation
```bash
git clone git@github.com:dekrain/path-parser.git
```
# How to use
On node.js
```javascript
const Path2DParser = require('path-parser');
const f = Path2DParser(code);
// or
const f = Path2DParser.open(path);

const ctx = canvas.getContext('2d');
f(ctx);
```

In browser
```html
<canvas id="cnv"></canvas>
<script src="path/to/path-parser.js"></script>
<script>
var path = Path2DParser(code);
var cnv = document.getElementById('cnv');
var ctx = cnv.getContext('2d')

ctx.fill(path);
// or
ctx.stroke(path);
</script>
```

# Syntax highlighting
```javascript
#!/usr/bin/env node
console.log(Path2DParser.format(code))
```

Screen:
![https://raw.githubusercontent.com/dekrain/path-parser/master/screen-node.png](https://raw.githubusercontent.com/dekrain/path-parser/master/screen-node.png)

# More informations
```javascript
var inf = Path2DParser(code, true);
var tokens = inf.tokens;
var AST = inf.ast;

var path = inf.result; // Browser
// or
var f = inf.result; // Node.js
```
