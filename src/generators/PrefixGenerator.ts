import { LogLevel } from '../enums/LogLevel';
import chalk from 'chalk';
import { getFinalOptions } from '../utilities/defaults';
import { LoggerOutput } from '../core/LoggerOutput';

// @ts-ignore
const isBrowser: boolean = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const LEVEL_MAP = {
	[LogLevel.Trace]: 'trace',
	[LogLevel.Debug]: 'debug',
	[LogLevel.Information]: 'information',
	[LogLevel.Warning]: 'warning',
	[LogLevel.Error]: 'error',
	[LogLevel.Critical]: 'critical',
	[LogLevel.None]: 'none'
};

const DEFAULT_COLORS = {
	trace: chalk.reset,
	debug: chalk.magentaBright,
	information: chalk.greenBright,
	warning: chalk.yellowBright,
	error: chalk.redBright,
	critical: chalk.redBright
};

/**
 * @internal
 */
export class PrefixGenerator {

	protected options;
	protected maxLabelWidth: number;
	protected colorEnabled;

	public constructor(options?: PrefixGeneratorOptions, colorEnabled?: boolean) {
		this.maxLabelWidth = 0;
		this.colorEnabled = colorEnabled ?? true;

		this.options = getFinalOptions(options, {
			includeLabels: true,
			includeLoggerNames: true,
			includeLabelAlignment: true,
			timestamps: {
				includeDates: false,
				includeTimeMillis: true,
				includeTimes: true,
				includeTimeZone: false
			},
			customLabels: {
				trace: 'Trace',
				debug: 'Debug',
				information: 'Info',
				warning: 'Warn',
				error: 'Error',
				critical: 'Critical'
			},
			customBracketColors: undefined,
			customHyphenColors: undefined,
			customTimestampColors: chalk.gray,
			customLabelColors: DEFAULT_COLORS,
			customLoggerNameColors: undefined,
			customLoggerBracketColors: options?.customBracketColors
		});

		for (const level in this.options.customLabels) {
			// @ts-ignore
			const width: number = this.options.customLabels[level].length;

			if (width > this.maxLabelWidth && level !== 'critical') {
				this.maxLabelWidth = width;
			}
		}
	}

	/**
	 * Generates a prefix for the given output.
	 *
	 * @param output
	 */
	public generate(output: LoggerOutput) {
		const time = this.colorize(this.getTime(output.timestamp), 'timestamp', output.level);
		const label = this.getLabel(output.level);
		const prefixParts = new Array<string>();
		const result = new Array<string>();

		// Add the label with padding
		if (this.options.includeLabels && label.length > 0) {
			const maxLabelWidth = this.options.includeLabelAlignment ? this.maxLabelWidth : 0;
			prefixParts.push(this.colorize(label.padEnd(maxLabelWidth, ' '), 'label', output.level));
		}

		// Add the timestamp if it's not blank
		if (time.length > 0) {
			prefixParts.push(time);
		}

		// Register the final prefix with colored brackets
		const openBracket = this.colorize('[', 'bracket', output.level);
		const closeBracket = this.colorize(']', 'bracket', output.level);
		result.push(openBracket + prefixParts.join(this.colorize(' - ', 'hyphen', output.level)) + closeBracket);

		// Add the logger name if applicable in another set of brackets
		if (this.options.includeLoggerNames && output.logger.name !== undefined) {
			const openBracket = this.colorize('[', 'nameBracket', output.level);
			const closeBracket = this.colorize(']', 'nameBracket', output.level);
			const name = openBracket + this.colorize(output.logger.name, 'name', output.level) + closeBracket;
			result.push(name);
		}

		return result.join(' ') + (result.length > 0 ? ' ' : '');
	}


	/**
	 * Returns the timestamp to include in the prefix or a blank string if not enabled.
	 *
	 * @param timestamp
	 * @returns
	 */
	protected getTime(timestamp: number) {
		const date = new Date(timestamp);
		const parts = new Array<string>();

		// Add the date
		if (this.options.timestamps.includeDates) {
			parts.push([
				date.getFullYear(),
				(date.getMonth() + 1).toString().padStart(2, '0'),
				date.getDate().toString().padStart(2, '0'),
			].join('-'));
		}

		// Add the time
		if (this.options.timestamps.includeTimes) {
			parts.push([
				date.getHours().toString().padStart(2, '0'),
				date.getMinutes().toString().padStart(2, '0'),
				date.getSeconds().toString().padStart(2, '0'),
			].join(':'));

			// Add milliseconds to the timestamp
			if (this.options.timestamps.includeTimeMillis) {
				const millis = date.getMilliseconds().toString().padStart(3, '0');
				parts[parts.length - 1] += '.' + millis;
			}

			// Add the timezone offset to the timestamp
			if (this.options.timestamps.includeTimeZone) {
				const offsetMinutes = date.getTimezoneOffset();

				parts.push(
					(offsetMinutes <= 0 ? '+' : '-') +
					Math.abs(offsetMinutes / 60).toString().padStart(2, '0') + ':' +
					Math.abs(offsetMinutes % 60).toString().padStart(2, '0')
				);
			}
		}

		return parts.join(' ');
	}

	/**
	 * Returns the logging level as a string.
	 *
	 * @param output
	 * @returns
	 */
	protected getLabel(level: LogLevel) {
		const options = this.options.customLabels;

		switch (level) {
			case LogLevel.Trace: return options.trace;
			case LogLevel.Debug: return options.debug;
			case LogLevel.Information: return options.information;
			case LogLevel.Warning: return options.warning;
			case LogLevel.Error: return options.error;
			case LogLevel.Critical: return options.critical;
		}

		throw new Error('Unknown log level: ' + level);
	}

	/**
	 * Returns the input with the specified color scheme applied.
	 *
	 * @param input
	 * @param type
	 * @param level
	 * @returns
	 */
	private colorize(input: string, type: ColorSchemeToken, level: LogLevel) {
		if (!this.colorEnabled || isBrowser || input.length === 0) {
			return input;
		}

		switch (type) {
			case 'bracket': return this.getColor('customBracketColors', level)(input);
			case 'nameBracket': return this.getColor('customLoggerBracketColors', level)(input);
			case 'label': return this.getColor('customLabelColors', level)(input);
			case 'hyphen': return this.getColor('customHyphenColors', level)(input);
			case 'timestamp': return this.getColor('customTimestampColors', level)(input);
			case 'name': return this.getColor('customLoggerColors', level)(input);
		}

		return chalk.reset(input);
	}

	/**
	 * Gets a function from the specified color option.
	 *
	 * @param optionName
	 * @param level
	 * @returns
	 */
	private getColor(optionName: string, level: LogLevel): ChalkColor {
		// @ts-ignore
		const o = this.options[optionName];

		if (typeof o === 'undefined') {
			return chalk.reset;
		}

		if (typeof o === 'function') {
			return o;
		}

		return o[LEVEL_MAP[level]];
	}

}

/**
 * @internal
 */
export interface PrefixGeneratorOptions {

	/**
	 * Whether to align labels.
	 * @default true
	 */
	includeLabelAlignment?: boolean;

	/**
	 * Whether to include labels in the output.
	 * @default true
	 */
	includeLabels?: boolean;

	/**
	 * Whether to include logger names in the output.
	 * @default true
	 */
	includeLoggerNames?: boolean;

	/**
	 * Customizes timestamps.
	 */
	timestamps?: {
		/**
		 * Whether to include the current time.
		 * @default true
		 */
		includeTimes?: boolean;

		/**
		 * Whether to include milliseconds in the current time.
		 * @default true
		 */
		includeTimeMillis?: boolean;

		/**
		 * Whether to include the current date.
		 * @default false
		 */
		includeDates?: boolean;

		/**
		 * Whether to include the timezone offset (ie `UTC+0:00`).
		 * @default false
		 */
		includeTimeZone?: boolean;
	};

	/**
	 * Customizes the labels to use in prefixes.
	 */
	customLabels?: LogLevelMap<string>;

	/**
	 * Customizes the colors to use for labels (logging levels).
	 */
	customLabelColors?: LogLevelMap<ChalkColor> | ChalkColor;

	/**
	 * Customizes the colors to use for timestamps.
	 */
	customTimestampColors?: LogLevelMap<ChalkColor> | ChalkColor;

	/**
	 * Customizes the color of logger names.
	 */
	customLoggerColors?: LogLevelMap<ChalkColor> | ChalkColor;

	/**
	 * Customizes the color of the brackets around logger names. When not set, it will default to the value of
	 * `customBracketColors`.
	 */
	customLoggerBracketColors?: LogLevelMap<ChalkColor> | ChalkColor;

	/**
	 * Customizes the color of brackets around the prefix.
	 */
	customBracketColors?: LogLevelMap<ChalkColor> | ChalkColor;

	/**
	 * Customizes the color of hyphen separators in prefixes.
	 */
	customHyphenColors?: LogLevelMap<ChalkColor> | ChalkColor;

}

type ColorSchemeToken = 'bracket' | 'label' | 'hyphen' | 'timestamp' | 'name' | 'nameBracket';
type ChalkColor = (...text: unknown[]) => string;
type LogLevelMap<T> = {
	trace?: T;
	debug?: T;
	information?: T;
	warning?: T;
	error?: T;
	critical?: T;
}
