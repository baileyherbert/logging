import { LoggerOutput } from '../core/LoggerOutput';
import { LogLevel } from '../enums/LogLevel';
import { Transport } from './Transport';
import { DeepNonNullable, getFinalOptions } from '../utilities/defaults';
import { PrefixGenerator, PrefixGeneratorOptions } from '../generators/PrefixGenerator';
import type { InspectOptions } from 'util';

// @ts-ignore
const isBrowser: boolean = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const util = isBrowser ? null : require('util');

/**
 * The console transport directs logger output to the console or standard output with optional colors.
 */
export class ConsoleTransport extends Transport {

	protected options: DeepNonNullable<ConsoleTransportOptions>;
	protected prefixes: PrefixGenerator;

	public constructor(level?: LogLevel, options?: ConsoleTransportOptions);
	public constructor(options?: ConsoleTransportOptions);
	public constructor(unknownA?: LogLevel | ConsoleTransportOptions, unknownB?: ConsoleTransportOptions) {
		const level = typeof unknownA === 'number' ? unknownA : undefined;
		const options = typeof unknownA === 'object' ? unknownA : unknownB;

		super(level);

		this.prefixes = new PrefixGenerator(options?.prefixes);
		this.options = getFinalOptions(options, {
			destination: 'console',
			formatting: { colors: true }
		});
	}

	/**
	 * Invoked when output is received from an attached logger.
	 */
	protected onLoggerOutput(output: LoggerOutput) {
		const prefix = this.prefixes.generate(output);

		if (isBrowser) {
			if (typeof output.args[0] === 'string') {
				output.args[0] = prefix + output.args[0];
			}
			else {
				output.args.unshift(prefix.trim());
			}

			switch (output.level) {
				case LogLevel.Trace:
				case LogLevel.Debug: return console.debug(...output.args);
				case LogLevel.Information: return console.info(...output.args);
				case LogLevel.Warning: return console.warn(...output.args);
				case LogLevel.Error:
				case LogLevel.Critical: return console.error(...output.args);
			}

			return;
		}

		const formatting = this.options.formatting as InspectOptions;
		const message = prefix + util.formatWithOptions(formatting, ...output.args);

		// Write to the console
		if (this.options.destination === 'console') {
			if (output.level < LogLevel.Warning) {
				console.log(message);
			}
			else {
				console.error(message);
			}
		}

		// Write to stdout and stderr
		else {
			if (output.level < LogLevel.Warning) {
				process.stdout.write(message + "\n");
			}
			else {
				process.stderr.write(message + "\n");
			}
		}
	}

}

export interface ConsoleTransportOptions {

	/**
	 * Customizes prefix options.
	 */
	prefixes?: PrefixGeneratorOptions;

	/**
	 * Chooses where output is sent.
	 *
	 * - `console` (default) sends to console.log or console.error.
	 * - `std` sends to the process' stdout or stderr.
	 *
	 * @default 'console'
	 */
	destination?: Destination;

	/**
	 * Customizes formatting options for messages. You can use this to disable colors, for example.
	 */
	formatting?: InspectOptions;

}

type Destination = 'std' | 'console';
