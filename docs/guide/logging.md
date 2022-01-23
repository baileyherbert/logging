# Logging

## Creating a logger

```ts
const logger = new Logger();
```

You can also give the logger a name to help discern it in the output:

```ts
const logger = new Logger('Example');
```

You can create a filtered logger, which will only emit at or above the given log level:

```ts
const logger = new Logger('Example', LogLevel.Information);
```

You can create child loggers which forward output to the same transports:

```ts
const child = logger.createLogger();
const child = logger.createLogger('Child');
const child = logger.createLogger('Child', LogLevel.Information);
```

## Attaching transports

### Using the `create` methods

There are methods on the `Logger` class to easily create and attach one of the built-in transports. For custom
transports, you'll need to use the `attach` method as documented further below.

```ts
logger.createConsoleTransport();
```

```ts
logger.createFileTransport({
	fileName: 'console.log'
});
```

Check the [transports documentation](transports.md) to see the available options for these methods.

### Using the `attach` method

When working with custom transports, or when you want to attach multiple root loggers to a single transport, you'll
need to instantiate the transport manually and then attach the logger(s).

```ts
const transport = new ConsoleTransport({ /* options */ });
transport.attach(logger);
```

## Getting attached transports

The `transports` field on a logger will return an array of all attached transports, including those attached to parent
logger(s). This is most useful for gracefully closing all attached transports:

```ts
await Promise.all(
	logger.transports.map(transport => transport.close())
);
```

## Logging levels

| Name          | Value | Description                                                                                                                                                                   |
| ------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Trace`       | `0`   | Logs that contain the most detailed messages. These messages can contain sensitive application data. These messages should not be used in a production environment.           |
| `Debug`       | `1`   | Logs that are used for interactive investigation during development. These logs should primarily contain information useful for debugging and have no long-term value.        |
| `Information` | `2`   | Logs that track the general flow of the application. These logs should have long-term value.                                                                                  |
| `Warning`     | `3`   | Logs that highlight an abnormal or unexpected event in the application flow, but do not otherwise cause the application execution to stop.                                    |
| `Error`       | `4`   | Logs that highlight when the current flow of execution is stopped due to a failure. These should indicate a failure in the current activity, not an application-wide failure. |
| `Critical`    | `5`   | Logs that describe an unrecoverable application or system crash, or a catastrophic failure that requires immediate attention.                                                 |
| `None`        | `6`   | Not used for writing log messages. Specifies that a logging category should not write any messages.                                                                           |

## Events

#### `output`

This event is emitted when the logger receives new output from the application.

| Argument | Types          | Description                                            |
| -------- | -------------- | ------------------------------------------------------ |
| `output` | `LoggerOutput` | An object containing details about the output message. |
