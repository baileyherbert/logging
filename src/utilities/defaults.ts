/**
 * Recursively builds an options object from defaults.
 *
 * @param options
 * @internal
 */
export function getFinalOptions<T, Y extends T>(input: T | undefined, defaults: Y): DeepNonNullable<T & Y> {
	function recurse(input: any, defaults: any) {
		const result: any = {};
		const keys = new Set<string>();

		if (input === undefined) {
			return defaults;
		}

		for (const name in defaults) {
			const inputValue = name in input ? input[name] : undefined;
			const defaultValue = defaults[name];
			keys.add(name);

			if (typeof defaultValue === 'object' && typeof inputValue === 'object') {
				result[name] = recurse(input[name], defaults[name]);
			}
			else {
				result[name] = inputValue ?? defaultValue;
			}
		}

		for (const name in input) {
			if (!keys.has(name)) {
				result[name] = input[name];
			}
		}

		return result;
	}

	return recurse(input, defaults);
}

/**
 * @internal
 */
export type DeepNonNullable<T> = {
	[P in keyof T]-?: NonNullable<DeepNonNullable<T[P]>>;
};
