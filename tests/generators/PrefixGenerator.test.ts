import { Logger, LogLevel, PrefixGenerator } from '../../src/main';
import chalk from 'chalk';
import dayjs from 'dayjs';

describe('PrefixGenerator', function() {
	it('generates a full prefix correctly', function() {
		const logger = new Logger('Test');
		const gen = new PrefixGenerator({
			customBracketColors: chalk.yellow,
			customHyphenColors: chalk.blackBright,
			customLabelColors: chalk.blue,
			customLoggerBracketColors: chalk.blueBright,
			customLoggerColors: chalk.red,
			customTimestampColors: chalk.redBright,
			includeLabelAlignment: true,
			includeLabels: true,
			includeLoggerNames: true,
			customLabels: {
				information: 'CustomLabel'
			},
			timestamps: {
				includeDates: true,
				includeTimeMillis: true,
				includeTimeZone: true,
				includeTimes: true
			}
		});

		const timestamp = 1638890829488;
		const expected = dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS Z');

		const result = gen.generate({
			logger,
			args: ['Hello world!'],
			level: LogLevel.Information,
			timestamp
		});

		expect(result).toMatch(
			chalk.yellow('[') +
			chalk.blue('CustomLabel') +
			chalk.blackBright(' - ') +
			chalk.redBright(expected) +
			chalk.yellow(']') +
			' ' +
			chalk.blueBright('[') +
			chalk.red('Test') +
			chalk.blueBright(']') +
			' '
		);
	});
});
