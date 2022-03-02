import { Logger, LogLevel } from '../../src/main';

describe('Logger', function() {
	it('constructs properly', function() {
		const logger = new Logger();
		const loggerWithOptions = new Logger('test', LogLevel.Trace);

		expect(logger.name).toBe(undefined);
		expect(logger.level).toBe(undefined);

		expect(loggerWithOptions.name).toBe('test');
		expect(loggerWithOptions.level).toBe(LogLevel.Trace);
	});

	it('emits based on log level', function() {
		const logger = new Logger('test', LogLevel.Information);
		const capture = jest.fn();

		logger.on('output', capture);
		logger.on('output', output => {
			expect(typeof output).toBe('object');
			expect(output.args).toEqual(['Hello world!', 123]);
			expect(output.level).toBe(LogLevel.Information);
			expect(typeof output.timestamp).toBe('number');
		});

		logger.info('Hello world!', 123);
		logger.debug('This should not be emitted due to the minimum log level');

		expect(capture).toHaveBeenCalledTimes(1);
	});

	it('correctly sends output to parents', function() {
		const topLogger = new Logger('top', LogLevel.Debug);
		const middleLogger = topLogger.createChild('middle');
		const topCapture = jest.fn();
		const middleCapture = jest.fn();

		topLogger.on('output', topCapture);
		middleLogger.on('output', middleCapture);

		middleLogger.trace('Test #1');
		middleLogger.debug('Test #2');

		expect(topCapture).toHaveBeenCalledTimes(1);
		expect(middleCapture).toHaveBeenCalledTimes(2);

		expect(middleLogger.level).toBe(undefined);
		expect(middleLogger.levelToRoot).toBe(LogLevel.Debug);
		expect(middleLogger.createChild().levelToRoot).toBe(LogLevel.Debug);

		const bottomLogger = middleLogger.createChild('bottom', LogLevel.Information);
		bottomLogger.info('Test #3');
		bottomLogger.debug('Test #4');

		expect(bottomLogger.level).toBe(LogLevel.Information);
		expect(bottomLogger.levelToRoot).toBe(LogLevel.Information);
		expect(topCapture).toHaveBeenCalledTimes(2);
	});

	it('emits all levels', function() {
		const logger = new Logger();
		const levels = new Array<LogLevel>();

		logger.on('output', output => levels.push(output.level));
		logger.trace();
		logger.debug();
		logger.info();
		logger.warning();
		logger.error();
		logger.critical();

		expect(levels).toEqual([
			LogLevel.Trace,
			LogLevel.Debug,
			LogLevel.Information,
			LogLevel.Warning,
			LogLevel.Error,
			LogLevel.Critical
		]);
	});

	it('can spawn nested children', function() {
		const logger = new Logger();
		const child = logger.createChild();
		const nestedChild = child.createChild();

		const capture = jest.fn();
		const emitters = new Array<Logger>();

		logger.on('output', output => {
			capture();
			emitters.push(output.logger);
		});

		logger.info('This will obviously reach');
		child.info('This should easily reach');
		nestedChild.info('This is where things can fail');

		expect(capture).toHaveBeenCalledTimes(3);
		expect(emitters).toEqual([
			logger,
			child,
			nestedChild
		]);
	});

	it('can attach other loggers', function() {
		const original = new Logger();
		const merger = new Logger();

		const capture = jest.fn();
		const emitters = new Array<Logger>();

		original.on('output', output => {
			capture();
			emitters.push(output.logger);
		});

		original.info('Control');
		merger.info('This should not reach the original');

		original.attach(merger);

		original.info('Control');
		merger.info('This should reach the original');

		expect(capture).toHaveBeenCalledTimes(3);
		expect(emitters).toEqual([
			original,
			original,
			merger
		]);
	});
});
