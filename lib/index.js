'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : {'default': obj};
}

var _broccoliPersistentFilter = require('broccoli-persistent-filter');

var _broccoliPersistentFilter2 = _interopRequireDefault(_broccoliPersistentFilter);

var _coffeelint = require('coffeelint');

var _coffeelint2 = _interopRequireDefault(_coffeelint);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ignore = require('ignore');

var _ignore2 = _interopRequireDefault(_ignore);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var linter = _coffeelint2['default'].lint;
var F_OK = _fs2['default'].F_OK;

var UTF_8 = 'utf-8';
var REPORTER_PATH = './reporter/stylish';
var COFFEE_LINT_JSON_PATH = './coffeelint.json';
var COFFEE_LINT_IGNORE_PATH = './.coffeelintignore';

/**
 *    Return a default formatter, if not specified.
 *
 *    @param formatter {function | String} A formatter function or path to one
 *    @returns {function} pretty formats linter output
 */
function getFormatter(formatter) {
	// eslint-disable-next-line global-require
	return typeof formatter === 'function' ? formatter : require(formatter || REPORTER_PATH);
}

/**
 *    Return coffeelint configuration rules
 *
 *    @param {String} configPath path to coffeelint.json file
 *    @returns {Object} coffeelint configuration rules
 */
function gatherLintConfigurations(configPath) {
	try {
		var rawCoffeeLintConfig = null;

		if (_fs2['default'].accessSync(configPath, F_OK)) {
			rawCoffeeLintConfig = _fs2['default'].readFileSync(configPath, UTF_8);
		}

		return JSON.parse(rawCoffeeLintConfig);
	} catch (e) {
		if (configPath === COFFEE_LINT_JSON_PATH) {
			return null;
		} else {
			throw 'Unable to parse json file: ' + _path2['default'].basename(COFFEE_LINT_JSON_PATH);
		}
	}
}

/**
 *    Creates a filter for the files specified in .coffeelintignore file
 *
 *    @returns {Array} filtered array of files
 */
function ignoreFilesFilter(lintIgnorePath) {
	try {
		if (_fs2['default'].accessSync(lintIgnorePath, F_OK)) {
			return (0, _ignore2['default'])().add(_fs2['default'].readFileSync(lintIgnorePath).toString()).createFilter();
		}
	} catch (e) {
		if (lintIgnorePath === COFFEE_LINT_IGNORE_PATH) {
			return null;
		} else {
			throw 'Unable to find file: ' + _path2['default'].basename(lintIgnorePath);
		}
	}
}

/**
 *    Uses the content of each file in a given node and runs coffeescript linter on it.
 *
 *    @param {Object} inputNode Node from broccoli.makeTree
 *    @param {{config: String, rulesdir: String, format: String}} options Filter options
 *    @returns {CoffeescriptLinter} Filter object created by @constructor
 */
function CoffeescriptLinter(inputNode, options) {

	if (!(this instanceof CoffeescriptLinter)) {
		return new CoffeescriptLinter(inputNode, options);
	}

	this._options = options || {};
	//const coffeeLintOptions = options.options || {};

	// default persist: true for filter output
	if (typeof this._options.persist === 'undefined') {
		this._options.persist = true;
	}

	// call base class construcor
	_broccoliPersistentFilter2['default'].call(this, inputNode, this._options);

	// set formatter
	this.formatter = getFormatter(this._options.format);

	// default configPath: COFFEE_LINT_JSON_PATH
	if (typeof this._options.configPath === 'undefined') {
		this._options.configPath = COFFEE_LINT_JSON_PATH;
	}

	// default lintIgnorePath: COFFEE_LINT_IGNORE_PATH
	if (typeof this._options.lintIgnorePath === 'undefined') {
		this._options.lintIgnorePath = COFFEE_LINT_IGNORE_PATH;
	}

	this.console = this._options.console || console;
	this.coffeelintJSON = gatherLintConfigurations(this._options.configPath);
	this.coffeelintignore = ignoreFilesFilter(this._options.lintIgnorePath);
}

CoffeescriptLinter.prototype = Object.create(_broccoliPersistentFilter2['default'].prototype);
CoffeescriptLinter.prototype.constructor = CoffeescriptLinter;

CoffeescriptLinter.prototype.baseDir = function () {
	return _path2['default'].resolve(__dirname, '..');
};

CoffeescriptLinter.prototype.processString = function (content, relativePath) {
	if (this.coffeelintignore) {
		var shouldPass = this.coffeelintignore('../' + relativePath);
		if (!shouldPass) {
			return content;
		}
	}
	try {
		var lintResults = linter(content, this.coffeelintJSON);
		this.formatter(relativePath, lintResults);
		return content;
	} catch (err) {
		err.line = err.location && err.location.first_line;
		err.column = err.location && err.location.first_column;
		throw err;
	}
};

CoffeescriptLinter.prototype.extensions = ['coffee'];
CoffeescriptLinter.prototype.targetExtension = 'coffee';

CoffeescriptLinter.prototype.optionsHash = function () {
	if (!this._optionsHash) {
		this._optionsHash = _crypto2['default'].createHash('md5').update((0, _jsonStableStringify2['default'])(this._options), 'utf8').update((0, _jsonStableStringify2['default'])(this.coffeelintJSON) || '', 'utf8').update((0, _jsonStableStringify2['default'])(this.coffeelintignore) || '', 'utf8').digest('hex');
	}

	return this._optionsHash;
};

CoffeescriptLinter.prototype.cacheKeyProcessString = function (string, relativePath) {
	return this.optionsHash() + _broccoliPersistentFilter2['default'].prototype.cacheKeyProcessString.call(this, string, relativePath);
};

exports['default'] = CoffeescriptLinter;
module.exports = exports['default'];
