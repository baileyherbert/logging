# Transports

## Console transports

This transport writes output to the console.

### Example

You can easily create a console transport with the `createConsoleTransport` method. The default options are shown
below.

```ts
const transport = logger.createConsoleTransport({
	destination: 'console',
	formatting: {},
	prefixes: {}
});
```

### Options

| Name          | Types                                                                                                                                      | Description                                                                        | Default   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | --------- |
| `destination` | `#!ts 'console' | 'std'`                                                                                                                   | Specifies whether output should be sent to the `console` functions or to `stdout`. | `console` |
| `formatting`  | [`InspectOptions`](https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules__types_node_util_d_._util_.inspectoptions.html) | Overrides specific options for `util.format()`.                                    | `{}`      |
| `prefixes`    | [`PrefixGeneratorOptions`](prefixes.md)                                                                                                    | Customizes prefix generation.                                                      | `{}`          |

### Events

#### `loggerAttached`

This event is emitted when a logger has been attached to the transport.

| Argument | Types    | Description                   |
| -------- | -------- | ----------------------------- |
| `logger` | `Logger` | The logger that was attached. |

#### `loggerDetached`

This event is emitted when a logger has been detached from the transport.

| Argument | Types    | Description                   |
| -------- | -------- | ----------------------------- |
| `logger` | `Logger` | The logger that was detached. |

## File transports

This transport writes output to a log file with automatic rotation.

### Example

You can easily create a file transport with the `createFileTransport` method. The default options are shown below.

```ts
const transport = logger.createFileTransport({
	fileName: 'console.log',
	encoding: 'utf8',
	eol: 'lf', // crlf for windows
	formatting: {},
	prefixes: {},
	rotation: {
		dirName: undefined, // defaults to same dir as fileName
		maxFileSize: 16777216, // 16 MiB
		maxArchiveCount: 10,
		maxArchiveAge: 2678400000 // 31 days
	},
});
```

### Options

| Name         | Types                                                                                                                                      | Description                                     | Default                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------- |
| `fileName`   | `string`                                                                                                                                   | The name or path of the log file.               | *required*                             |
| `encoding`   | `string`                                                                                                                                   | The encoding to use.                            | `utf8`                                 |
| `eol`        | `#!ts 'lf' | 'crlf'`                                                                                                                       | The line endings to use.                        | `crlf` for Windows<br> `lf` for others |
| `formatting` | [`InspectOptions`](https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules__types_node_util_d_._util_.inspectoptions.html) | Overrides specific options for `util.format()`. | `{}`                                   |
| `prefixes`   | [`PrefixGeneratorOptions`](prefixes.md)                                                                                                    | Customizes prefix generation.                   | `{}`                                   |
| `rotation`   | `object`, `false`                                                                                                                          | Customizes automatic log rotation.              | See below                              |

**Rotation options:**

| Name              | Types     | Description                                                                                            | Default                |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------ | ---------------------- |
| `dirName`         | `string?` | The name or path of the directory for archived logs.                                                   | Same as log file.      |
| `maxFileSize`     | `number`  | The maximum size of the log file (in bytes) before rotation.                                           | `16777216` (16 MiB)    |
| `maxArchiveCount` | `number`  | The maximum number of log archives to keep on the disk. Setting this to `0` will disable this feature. | `10`                   |
| `maxArchiveAge`   | `number`  | The maximum age of log archives (in milliseconds). Setting this to `0` will disable this feature.      | `2678400000` (31 days) |

### Events

#### `loggerAttached`

This event is emitted when a logger has been attached to the transport.

| Argument | Types    | Description                   |
| -------- | -------- | ----------------------------- |
| `logger` | `Logger` | The logger that was attached. |

#### `loggerDetached`

This event is emitted when a logger has been detached from the transport.

| Argument | Types    | Description                   |
| -------- | -------- | ----------------------------- |
| `logger` | `Logger` | The logger that was detached. |

#### `rotated`

This event is emitted when the log file is rotated.

| Argument | Types    | Description                         |
| -------- | -------- | ----------------------------------- |
| `file`   | `object` | Details about the rotated log file. |

#### `cleaned`

This event is emitted when an archived log file is deleted due to expiry.

| Argument | Types    | Description                         |
| -------- | -------- | ----------------------------------- |
| `file`   | `object` | Details about the deleted log file. |

## Creating custom transports

### Basic template

Transports receive an object each time a logger emits output. This object contains the logger, the logging level, the
timestamp, and an array of raw arguments that were passed to the logger.

```ts
import { Transport } from '@baileyherbert/logging';

export class CustomTransport extends Transport {

	/**
	 * Invoked when output is received from an attached logger.
	 */
	protected onLoggerOutput(output: LoggerOutput) {
		console.log(...output.args);
	}

}
```

### Dealing with promises

In some cases, a transport might need to deliver output asynchronously. You may also need to implement an internal
queue to accept new output while still delivering previous output. This responsibility for these lie solely with the
transport.
