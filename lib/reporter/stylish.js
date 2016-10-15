'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _textTable = require('text-table');

var _textTable2 = _interopRequireDefault(_textTable);

function pluralize(word, count) {
	return count === 1 ? word : word + 's';
}

function formatOp(filePath, messages) {
	var output = '\n',
	    infos = 0,
	    warnings = 0,
	    errors = 0,
	    total = 0,
	    summaryColor = 'yellow';

	output += _chalk2['default'].underline(filePath + '\n\n');

	var msgRows = messages.map(function (message) {
		var lineNumber = message.lineNumber;
		var messageType = message.level;

		switch (messageType) {
			case 'info':
				messageType = _chalk2['default'].cyan(messageType);
				infos++;
				break;
			case 'error':
				messageType = _chalk2['default'].red(messageType);
				errors++;
				summaryColor = 'red';
				break;
			case 'default':
				messageType = _chalk2['default'].white(messageType);
		}

		return ['', _chalk2['default'].dim(lineNumber), messageType, message.message, ''];
	});

	total = errors + warnings + infos;

	output += (0, _textTable2['default'])(msgRows, {
		align: ['', 'c', 'c', 'l', ''],
		stringLength: function stringLength(str) {
			return _chalk2['default'].stripColor(str).length;
		}
	}) + '\n\n';

	output += _chalk2['default'][summaryColor].bold(['✖ ', total, pluralize(' problem', total), ' (', errors, pluralize(' error', errors), ', ', warnings, pluralize(' warning', warnings), ', ', infos, pluralize(' info', infos), ')\n'].join(''));

	output += '\n\n';

	console.log(output);
}

module.exports = formatOp;