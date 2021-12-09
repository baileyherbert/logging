# Logging

This package offers a logging solution based on a modular delivery concept. Simply create a logger instance, attach a
delivery transport (such as console, file, or your own), and start logging!

## Installation

```plain
npm install @baileyherbert/logging
```

## Example

Create a logger instance. This is what we'll use to actually write output.

```ts
const logger = new Logger();
```

Create a console transport. This will print our output to the console. You can define a minimum log level for output.
We'll use `Trace` here which will capture all levels of output.

```ts
logger.createConsoleTransport(LogLevel.Trace);
```

Create a file transport. This will send our output into a file. We'll set a minimum log level of `Information` to keep
the logs minimal. Please note that the file transport has automatic log rotation enabled by default, but you can
customize or disable this behavior.

```ts
logger.createFileTransport(LogLevel.Information, {
    fileName: 'logs/output.log'
});
```

Done! Now use the logger to write output to both the console and log file at once.

```ts
logger.trace('Starting example program');
logger.info('Hello world');
```

Both of those transports have many customization options, and you can also create your own. Check the
[transports guide](https://docs.bailey.sh/logging/latest/guide/transports/) to learn more.

## Documentation

- [Documentation website](https://docs.bailey.sh/logging/)
