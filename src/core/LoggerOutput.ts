import { LogLevel } from '../enums/LogLevel';
import { Logger } from './Logger';

export interface LoggerOutput {

	/**
	 * The logger that generated this output.
	 */
	logger: Logger;

	/**
	 * The logging level for this output.
	 */
	level: LogLevel;

	/**
	 * The time that this output was generated.
	 */
	timestamp: number;

	/**
	 * The raw message arguments for the output.
	 */
	args: any[];

}
