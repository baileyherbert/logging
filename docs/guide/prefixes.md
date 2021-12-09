# Prefixes

The integrated console and file transports share the same prefix generator. This page documents the various options
and customizations for your prefixes.

## Defaults

The default prefix configuration object looks like this:

```ts
{
	includeLabels: true,
	includeLoggerNames: true,
	includeLabelAlignment: true,
	timestamps: {
		includeDates: false,
		includeTimeMillis: true,
		includeTimes: true,
		includeTimeZone: false
	},
	customLabels: {
		trace: 'Trace',
		debug: 'Debug',
		information: 'Info',
		warning: 'Warn',
		error: 'Error',
		critical: 'Critical'
	},
	customBracketColors: undefined,
	customHyphenColors: undefined,
	customTimestampColors: chalk.gray,
	customLabelColors: {
		trace: chalk.reset,
		debug: chalk.magentaBright,
		information: chalk.greenBright,
		warning: chalk.yellowBright,
		error: chalk.redBright,
		critical: chalk.redBright
	},
	customLoggerNameColors: undefined,
	customLoggerBracketColors: undefined
}
```

## Labels

Labels are a textual representation of the log level, such as `Information` or `Debug`.

## Timestamps

Timestamps showcase the current time, date, and timezone.

## Logger names

Logger names, when available, are added after the prefix in their own set of brackets.

## Colors

All colors can be customized as shown within the defaults above. Each color component can be set to:

- A function from the `chalk` library, such as `chalk.red`.
- An object containing the various log levels as keys and `chalk` functions as values.
- `undefined` to use the default.

Note that you can use `chalk.reset` for any color to disable it.
