import chalk from 'chalk';
import table from 'text-table';

function pluralize(word, count) {
	return (count === 1 ? word : `${word}s`);
}

function formatOp(filePath, messages) {
	let output = '\n',
		infos = 0,
		warnings = 0,
		errors = 0,
		total = 0,
		summaryColor = 'yellow';

	output += chalk.underline(`${filePath}\n\n`);

	const msgRows = messages.map((message) => {
		const lineNumber = message.lineNumber;
		let messageType = message.level;

		switch (messageType) {
			case 'info':
				messageType = chalk.cyan(messageType);
				infos++;
				break;
			case 'error':
				messageType = chalk.red(messageType);
				errors++;
				summaryColor = 'red';
				break;
			case 'default':
				messageType = chalk.white(messageType)
		}

		return [
			'',
			chalk.dim(lineNumber),
			messageType,
			message.message,
			''
		]
	});

	total = errors + warnings + infos;

	output += table(msgRows, {
			align: ['', 'c', 'c', 'l', ''],
			stringLength: function (str) {
				return chalk.stripColor(str).length;
			}
		}) + '\n\n';

	output += chalk[summaryColor].bold([
		'\u2716 ',
		total, pluralize(' problem', total),
		' (',
		errors, pluralize(' error', errors),
		', ',
		warnings, pluralize(' warning', warnings),
		', ',
		infos, pluralize(' info', infos),
		')\n'
	].join(''));

	output += '\n\n';

	console.log(output);
}

module.exports = formatOp;
