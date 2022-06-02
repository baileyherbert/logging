import { EventEmitter } from '@baileyherbert/events';
import { LogLevel } from '../enums/LogLevel';
import { Transport } from '../main';
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
	 * A boolean indicating whether this logger should buffer its messages instead of delivering them to its attached
	 * transports. You'll need to use the `flush()` method to push them.
	 * @default false
	 */
	public buffer = false;

	/**
	 * An array of all transports that have been attached to this logger.
	 */
	private _transports = new Set<Transport>();

	/**
	 * The loggers this instance is attached to (and will forward output to).
	 */
	private _attachedTo = new Set<Logger>();

	/**
	 * The buffered messages in this logger.
	 */
	private _bufferedMessages = new Array<[message: LoggerOutput, forceful: boolean]>();

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

		if (parent) {
			this._attachedTo.add(parent);
		}
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
			if (this.buffer) {
				this._bufferedMessages.push([output, forceful]);
				return;
			}

			this.emit('output', output);

			for (const logger of this._attachedTo) {
				logger.writeToRoot(output, forceful);
			}
		}
	}

	/**
	 * Forcefully sends all buffered output, and then clears the buffer.
	 * @param end If true, stops buffering when finished. Defaults to `false`.
	 */
	public flush(end = false) {
		for (const [output, forceful] of this._bufferedMessages) {
			this.emit('output', output);

			for (const logger of this._attachedTo) {
				logger.writeToRoot(output, forceful);
			}
		}

		this._bufferedMessages = [];
		this.buffer = end ? false : this.buffer;
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
		return new Logger(name, level, this);
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

	/**
	 * @internal
	 */
	public _attachTransport(transport: Transport) {
		this._transports.add(transport);
	}

	/**
	 * @internal
	 */
	public _detachTransport(transport: Transport) {
		this._transports.delete(transport);
	}

	/**
	 * @internal
	 */
	public _attachToLogger(logger: Logger) {
		if (!this._attachedTo.has(logger)) {
			this._attachedTo.add(logger);
		}
	}

	/**
	 * @internal
	 */
	public _detachFromLogger(logger: Logger) {
		if (logger !== this.parent) {
			this._attachedTo.delete(logger);
		}
	}

	/**
	 * Returns an array of all active transports that are listening to this logger.
	 */
	public get transports(): Transport[] {
		if (this.parent) {
			return [...this._transports, ...this.parent.transports];
		}

		return [...this._transports];
	}

	/**
	 * Attaches the given logger to this logger. The loggers will still be independent, however the given logger's
	 * output will be cloned into this logger.
	 *
	 * @param logger
	 */
	public attach(logger: Logger) {
		logger._attachToLogger(this);
	}

	/**
	 * Detaches the given logger from this logger.
	 *
	 * @param logger
	 */
	public detach(logger: Logger) {
		logger._detachFromLogger(this);
	}

}

type LoggerEvents = {
	/**
	 * Emitted when the logger receives output within its configured log level.
	 */
	output: [event: LoggerOutput];
};
