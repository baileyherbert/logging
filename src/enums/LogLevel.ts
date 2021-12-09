/**
 * Defines logging severity levels.
 */
export enum LogLevel {
	/**
	 * Logs that contain the most detailed messages. These messages can contain sensitive application data. These
	 * messages should not be used in a production environment.
	 */
	Trace,

	/**
	 * Logs that are used for interactive investigation during development. These logs should primarily contain
	 * information useful for debugging and have no long-term value.
	 */
	Debug,

	/**
	 * Logs that track the general flow of the application. These logs should have long-term value.
	 */
	Information,

	/**
	 * Logs that highlight an abnormal or unexpected event in the application flow, but do not otherwise cause the
	 * application execution to stop.
	 */
	Warning,

	/**
	 * Logs that highlight when the current flow of execution is stopped due to a failure. These should indicate a
	 * failure in the current activity, not an application-wide failure.
	 */
	Error,

	/**
	 * Logs that describe an unrecoverable application or system crash, or a catastrophic failure that requires
	 * immediate attention.
	 */
	Critical,

	/**
	 * Not used for writing log messages. Specifies that a logging category should not write any messages.
	 */
	None
}
