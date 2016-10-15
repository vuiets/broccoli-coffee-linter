import Filter from 'broccoli-persistent-filter';
import CoffeeLint from 'coffeelint';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import crypto from 'crypto';
import stringify from 'json-stable-stringify';

const { lint: linter } = CoffeeLint;
const { F_OK } = fs;

const UTF_8 = 'utf-8';
const REPORTER_PATH = './reporter/stylish';
const COFFEE_LINT_JSON_PATH = './coffeelint.json';
const COFFEE_LINT_IGNORE_PATH = './.coffeelintignore';

/**
 *    Return a default formatter, if not specified.
 *
 *    @param formatter {function | String} A formatter function or path to one
 *    @returns {function} pretty formats linter output
 */
function getFormatter(formatter) {
	// eslint-disable-next-line global-require
	return (typeof formatter === 'function') ? formatter : require(formatter || REPORTER_PATH);
}

/**
 *    Return coffeelint configuration rules
 *
 *    @param {String} configPath path to coffeelint.json file
 *    @returns {Object} coffeelint configuration rules
 */
function gatherLintConfigurations(configPath) {
	try {
		let rawCoffeeLintConfig = null;

		if (fs.accessSync(configPath, F_OK)) {
			rawCoffeeLintConfig = fs.readFileSync(configPath, UTF_8);
		}

		return JSON.parse(rawCoffeeLintConfig);
	} catch (e) {
		if (configPath === COFFEE_LINT_JSON_PATH) {
			return null;
		} else {
			throw `Unable to parse json file: ${path.basename(COFFEE_LINT_JSON_PATH)}`;
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
		if (fs.accessSync(lintIgnorePath, F_OK)) {
			return ignore()
				.add(fs.readFileSync(lintIgnorePath).toString())
				.createFilter();
		}
	} catch (e) {
		if (lintIgnorePath === COFFEE_LINT_IGNORE_PATH) {
			return null;
		} else {
			throw `Unable to find file: ${path.basename(lintIgnorePath)}`;
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
	Filter.call(this, inputNode, this._options);

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

CoffeescriptLinter.prototype = Object.create(Filter.prototype);
CoffeescriptLinter.prototype.constructor = CoffeescriptLinter;

CoffeescriptLinter.prototype.baseDir = function () {
	return path.resolve(__dirname, '..');
};

CoffeescriptLinter.prototype.processString = function (content, relativePath) {
	if (this.coffeelintignore) {
		const shouldPass = this.coffeelintignore(`../${relativePath}`);
		if (!shouldPass) {
			return content;
		}
	}
	try {
		const lintResults = linter(content, this.coffeelintJSON);
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
		this._optionsHash = crypto.createHash('md5')
			.update(stringify(this._options), 'utf8')
			.update(stringify(this.coffeelintJSON) || '', 'utf8')
			.update(stringify(this.coffeelintignore) || '', 'utf8')
			.digest('hex');
	}

	return this._optionsHash;
};

CoffeescriptLinter.prototype.cacheKeyProcessString = function (string, relativePath) {
	return this.optionsHash() + Filter.prototype.cacheKeyProcessString.call(this, string, relativePath);
};

export default CoffeescriptLinter;
