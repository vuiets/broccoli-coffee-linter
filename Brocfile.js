var esTranspiler = require('broccoli-babel-transpiler');

var scriptTree = esTranspiler('src', {
	filterExtensions: ['js', 'es6']
});

module.exports = scriptTree;
