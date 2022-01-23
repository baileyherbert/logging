import { EventEmitter, EventEmitterSchema } from '@baileyherbert/events';
import { Logger } from '../core/Logger';
import { LoggerOutput } from '../core/LoggerOutput';
import { LogLevel } from '../enums/LogLevel';

export abstract class Transport<S extends EventEmitterSchema = {}> extends EventEmitter<S & TransportEvents> {

	/**
	 * Specifies the minimum logging level that the transport will handle.
	 */
	public level = LogLevel.Information;

	/**
	 * A map of attached loggers and the internal listeners used to receive their output.
	 */
	private _listeners = new Map<Logger, Listener>();

	/**
	 * Constructs a transport instance.
	 *
	 * @param level
	 *   The minimum logging level that the transport will handle.
	 */
	public constructor(level?: LogLevel) {
		super();

		if (typeof level === 'number') {
			this.level = level;
		}
	}

	/**
	 * Attaches a logger to this transport and starts listening for output.
	 *
	 * @param logger The logger instance to attach.
	 */
	public attach(logger: Logger) {
		if (!this._listeners.has(logger)) {
			const listener = (output: LoggerOutput) => {
				if (output.level >= this.level) {
					this.onLoggerOutput(output);
				}
			};

			this._listeners.set(logger, listener);
			logger.on('output', listener);
			logger._attachTransport(this);

			// @ts-ignore
			this.emit('loggerAttached', logger);
			this.onLoggerAttached(logger);
		}
	}

	/**
	 * Detaches a logger from this transport and stops listening for output.
	 *
	 * @param logger The logger instance to detach.
	 */
	public detach(logger: Logger) {
		if (this._listeners.has(logger)) {
			const listener = this._listeners.get(logger)!;
			this._listeners.delete(logger);
			logger.removeListener('output', listener);
			logger._detachTransport(this);

			// @ts-ignore
			this.emit('loggerDetached', logger);
			this.onLoggerDetached(logger);
		}
	}

	/**
	 * Invoked when output is received from an attached logger.
	 *
	 * @param output An object containing details about the message.
	 */
	protected abstract onLoggerOutput(output: LoggerOutput): void;

	/**
	 * Invoked when a logger is attached to the transport.
	 *
	 * @param logger The logger that was attached.
	 */
	protected onLoggerAttached(logger: Logger): Promisable<void> {

	}

	/**
	 * Invoked when a logger is detached from the transport.
	 *
	 * @param logger The logger that was detached.
	 */
	protected onLoggerDetached(logger: Logger): Promisable<void> {

	}

	/**
	 * Closes the transport. Returns a promise that resolves when complete.
	 */
	public close() {
		this.detachAll();

		return Promise.resolve();
	}

	/**
	 * Detaches the transport from all loggers.
	 */
	public detachAll() {
		for (const logger of this._listeners.keys()) {
			this.detach(logger);
		}
	}

}

type Listener = (output: LoggerOutput) => void;
type Promisable<T> = T | Promise<T>;

type TransportEvents = {
	/**
	 * Emitted when a logger is attached to the transport.
	 */
	loggerAttached: [logger: Logger];

	/**
	 * Emitted when a logger is detached from the transport.
	 */
	loggerDetached: [logger: Logger];
};
