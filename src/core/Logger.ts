import { EventEmitter } from '@baileyherbert/events';
import { LogLevel } from '../enums/LogLevel';
import { ConsoleTransport, ConsoleTransportOptions } from '../transports/ConsoleTransport';
import { FileTransport, FileTransportOptions } from '../transports/FileTransport';
import { LoggerOutput } from './LoggerOutput';

export class Logger extends EventEmitter<LoggerEvents> {

	/**
	 * A custom logging level to use for this logger. When not specified, output from all levels will be emitted.
	 *
	 * Remember that transports can specify their own logging levels. This property will not override those levels.
	 * Rather, it will limit what this particular logger emits to any attached transports.
	 */
	public level?: LogLevel | null;

	/**
	 * A name for this logger. When specified, transports can prefix logging output with this name in order to help
	 * discern where those messages came from.
	 */
	public name?: string;

	/**
	 * Constructs a new `Logger` instance.
	 *
	 * @param name
	 *   Specifies a name for the logger. Transports can prefix messages with this name to help discern where that
	 *   output originated from.
	 *
	 * @param level
	 *   Specifies the minimum logging level that output must specify in order for this logger to emit it. When not
	 *   specified, the logger will emit output of all levels.
	 *
	 * @param parent
	 *   Specifies a parent logger instance. When a parent is specified, all output from this logger will be forwarded
	 *   to the logger at the top of the hierarchy.
	 */
	public constructor(name?: string, level?: LogLevel, protected parent?: Logger) {
		super();

		this.name = name;
		this.level = level;
	}

	/**
	 * The minimum level required for output to get emitted on the root logger instance. This getter walks through all
	 * parent loggers in the hierarchy and returns the highest level.
	 */
	public get levelToRoot() {
		let highestLevel = LogLevel.Trace;
		let parent: Logger | undefined = this;

		while (parent) {
			if (typeof parent.level === 'number') {
				if (parent.level > highestLevel) {
					highestLevel = parent.level;
				}
			}

			parent = parent.parent;
		}

		return highestLevel;
	}

	/**
	 * Writes output of the specified level.
	 *
	 * @param level
	 * @param args
	 */
	public write(level: LogLevel, ...args: any[]) {
		this.writeToRoot({
			logger: this,
			level,
			timestamp: Date.now(),
			args
		});

		return this;
	}

	/**
	 * Writes the given output object to the root logger by propagating through the logger hierarchy and checking
	 * the output against each logger's minimum logging level.
	 *
	 * @param output The output object to forward.
	 * @param forceful Send to the root logger regardless of minimum logging levels.
	 */
	protected writeToRoot(output: LoggerOutput, forceful = false) {
		if (forceful || this.isEnabled(output.level)) {
			this.emit('output', output);

			if (this.parent) {
				this.parent.writeToRoot(output, forceful);
			}
		}
	}

	/**
	 * Returns whether the given logging level is enabled for this logger.
	 *
	 * @param level
	 * @internal
	 */
	public isEnabled(level: LogLevel) {
		return typeof this.level !== 'number' || level >= this.level;
	}

	/**
	 * Sends trace output to the logger.
	 *
	 * Trace logs contain the most detailed messages. These messages can contain sensitive application data. These
	 * messages should not be used in a production environment.
	 *
	 * @param args Raw arguments to send to the logger, just like with console.log()
	 * @returns The same logger instance
	 */
	public trace(...args: any[]) {
		return this.write(LogLevel.Trace, ...args);
	}

	/**
	 * Sends debug output to the logger.
	 *
	 * Debug logs are used for interactive investigation during development. These logs should primarily contain
	 * information useful for debugging and have no long-term value.
	 *
	 * @param args Raw arguments to send to the logger, just like with console.log()
	 * @returns The same logger instance
	 */
	public debug(...args: any[]) {
		return this.write(LogLevel.Debug, ...args);
	}

	/**
	 * Sends information output to the logger.
	 *
	 * Information logs track the general flow of the application. These logs should have long-term value.
	 *
	 * @param args Raw arguments to send to the logger, just like with console.log()
	 * @returns The same logger instance
	 */
	public info(...args: any[]) {
		return this.write(LogLevel.Information, ...args);
	}

	/**
	 * Sends warning output to the logger.
	 *
	 * Warning logs highlight an abnormal or unexpected event in the application flow, but do not otherwise cause the
	 * application execution to stop.
	 *
	 * @param args Raw arguments to send to the logger, just like with console.log()
	 * @returns The same logger instance
	 */
	public warning(...args: any[]) {
		return this.write(LogLevel.Warning, ...args);
	}

	/**
	 * Sends error output to the logger.
	 *
	 * Error logs highlight when the current flow of execution is stopped due to a failure. These should indicate a
	 * failure in the current activity, not an application-wide failure.
	 *
	 * @param args Raw arguments to send to the logger, just like with console.log()
	 * @returns The same logger instance
	 */
	public error(...args: any[]) {
		return this.write(LogLevel.Error, ...args);
	}

	/**
	 * Sends critical output to the logger.
	 *
	 * Critical logs describe an unrecoverable application or system crash, or a catastrophic failure that requires
	 * immediate attention.
	 *
	 * @param args Raw arguments to send to the logger, just like with console.log()
	 * @returns The same logger instance
	 */
	public critical(...args: any[]) {
		return this.write(LogLevel.Critical, ...args);
	}

	/**
	 * Creates a new child logger that sends output to the same transports as this one.
	 *
	 * @param name
	 *   Specifies a name for the new logger. Transports can prefix messages with this name to help discern where that
	 *   output originated from.
	 *
	 * @param level
	 *   Specifies the minimum logging level for the new logger. When not specified, the logger will emit output of all
	 *   levels.
	 */
	public createChild(name?: string, level?: LogLevel) {
		return new Logger(name, level, this.parent ?? this);
	}

	/**
	 * Creates a new console transport with the specified log level and options. The logger will be attached to the
	 * transport automatically, and it will then be returned.
	 *
	 * @param level The minimum log level for output to be handled by the transport.
	 * @param options The constructor options for the transport.
	 * @returns
	 */
	public createConsoleTransport(level?: LogLevel, options?: ConsoleTransportOptions): ConsoleTransport;
	public createConsoleTransport(options: ConsoleTransportOptions): ConsoleTransport;
	public createConsoleTransport(level?: LogLevel | ConsoleTransportOptions, options?: ConsoleTransportOptions) {
		// @ts-ignore
		const transport = new ConsoleTransport(level, options);
		transport.attach(this);
		return transport;
	}

	/**
	 * Creates a new file transport with the specified log level and options. The logger will be attached to the
	 * transport automatically, and it will then be returned.
	 *
	 * @param level The minimum log level for output to be handled by the transport.
	 * @param options The constructor options for the transport.
	 * @returns
	 */
	public createFileTransport(level: LogLevel, options: FileTransportOptions): FileTransport;
	public createFileTransport(options: FileTransportOptions): FileTransport;
	public createFileTransport(level: LogLevel | FileTransportOptions, options?: FileTransportOptions) {
		// @ts-ignore
		const transport = new FileTransport(level, options);
		transport.attach(this);
		return transport;
	}

}

type LoggerEvents = {
	/**
	 * Emitted when the logger receives output within its configured log level.
	 */
	output: [event: LoggerOutput];
};
