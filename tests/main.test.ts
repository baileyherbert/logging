import * as Main from '../src/main';

describe('main', function() {
	it('exports all expected items', function() {
		// Classes
		expect(typeof Main.Logger).toBe('function');
		expect(typeof Main.Transport).toBe('function');
		expect(typeof Main.ConsoleTransport).toBe('function');
		expect(typeof Main.FileTransport).toBe('function');
		expect(typeof Main.PrefixGenerator).toBe('function');

		// Objects
		expect(typeof Main.LogLevel).toBe('object');
	});
});
