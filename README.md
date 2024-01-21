<p align="center">
    <a href="https://github.com/omaha-js/omaha" target="_blank" rel="noopener noreferrer">
        <img width="96" height="96" src="https://i.bailey.sh/mA6G3zHDcE.png" alt="Bailey Herbert Logo">
    </a>
</p>
<p align="center">
    <a href="https://github.com/baileyherbert/logging" target="_blank" rel="noopener noreferrer">github</a> &nbsp;/&nbsp;
    <a href="https://www.npmjs.com/package/@baileyherbert/logging" target="_blank" rel="noopener noreferrer">npm</a> &nbsp;/&nbsp;
    <a href="https://docs.bailey.sh/logging/" target="_blank" rel="noopener noreferrer">documentation</a>
</p>

# logging

An elegant logging solution for TypeScript built on a hierarchical composite pattern.

```
npm install @baileyherbert/logging
```

## examples

### creating the root logger

Each application needs at least one root logger instance.

```ts
const rootLogger = new Logger();
```

### attaching transports to the root logger

The root logger is responsible for piping its output into one or more transports. The example below will create and attach a [console transport](https://docs.bailey.sh/logging/latest/guide/transports/) to the logger, which writes logs directly to the console. This works in a browser environment.

```ts
rootLogger.createConsoleTransport();
```

### creating child loggers

Each service in your application should have its own logger instance. These are called child loggers, and they are used to automatically prefix output from services with their names.

```ts
const logger = rootLogger.createChild('ServiceName');
```

### writing logs

Loggers expose methods for each supported severity level.

```ts
logger.trace();
logger.debug();
logger.info();
logger.warning();
logger.error();
logger.critical();
```

These methods work identically to `console.log()`. You can pass multiple parameters of any type, and can pass a string for formatting.

```ts
logger.info('Logged in as %s from %s', username, ip);
```

## license

MIT
