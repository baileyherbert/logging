import { WriteStream } from 'fs';
import { InspectOptions } from 'util';
import { LoggerOutput } from '../core/LoggerOutput';
import { LogLevel } from '../enums/LogLevel';
import { PrefixGenerator, PrefixGeneratorOptions } from '../generators/PrefixGenerator';
import { DeepNonNullable, getFinalOptions } from '../utilities/defaults';
import { Transport } from './Transport';
import fs from 'fs';
import path from 'path';
import { PromiseCompletionSource } from '../utilities/promises';

// @ts-ignore
const isBrowser: boolean = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const util = isBrowser ? null : require('util');

const LEVEL_MAP = {
	[LogLevel.Trace]: 'trace',
	[LogLevel.Debug]: 'debug',
	[LogLevel.Information]: 'information',
	[LogLevel.Warning]: 'warning',
	[LogLevel.Error]: 'error',
	[LogLevel.Critical]: 'critical',
	[LogLevel.None]: 'none'
};

/**
 * The file transport directs logger output to a file with optional automatic log rotation.
 */
export class FileTransport extends Transport<FileTransportEvents> {

	protected options: DeepNonNullable<FileTransportOptions>;
	protected prefixes: PrefixGenerator;

	protected stream: WriteStream;
	protected currentFileSize: number;

	protected writing: boolean;
	protected queue: Array<LoggerOutput>;

	public constructor(level: LogLevel, options: FileTransportOptions);
	public constructor(options: FileTransportOptions);
	public constructor(unknownA: LogLevel | FileTransportOptions, unknownB?: FileTransportOptions) {
		const level = typeof unknownA === 'number' ? unknownA : undefined;
		const options = typeof unknownA === 'object' ? unknownA : unknownB;

		super(level);

		this.prefixes = new PrefixGenerator(options?.prefixes, false);
		this.options = getFinalOptions(options, {
			rotation: {
				dirName: undefined,
				maxFileSize: 16777216,
				maxArchiveCount: 10,
				maxArchiveAge: 2678400000
			},
			fileName: 'console.log',
			encoding: 'utf8',
			formatting: {},
			eol: require('os').EOL === "\n" ? 'lf' : 'crlf'
		});

		this.currentFileSize = 0;
		this.writing = false;
		this.queue = [];

		this.stream = this.openFileStream();
		this.readFileSize();
	}

	protected onLoggerOutput(output: LoggerOutput) {
		this.write([output]);
	}

	protected async write(lines: LoggerOutput[]): Promise<void> {
		if (this.writing) {
			this.queue.push(...lines);
			return;
		}

		this.writing = true;

		for (const output of lines) {
			const content = (
				this.prefixes.generate(output) +
				util.formatWithOptions(this.options.formatting, ...output.args) +
				this.eol
			);

			this.currentFileSize += content.length;
			const rotateAfter = (this.options.rotation && this.options.rotation.maxFileSize) ?? 0;

			if (rotateAfter > 0 && this.currentFileSize >= rotateAfter) {
				await this.rotate(content);
			}
			else {
				this.stream.write(content);
			}
		}

		this.writing = false;

		if (this.queue.length > 0) {
			const queue = [...this.queue];
			this.queue = [];
			return this.write(queue);
		}
	}

	/**
	 * Opens a write stream (`a+`) on the target log file path.
	 *
	 * @returns
	 */
	protected openFileStream() {
		const dir = path.dirname(path.resolve(this.options.fileName));

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		return fs.createWriteStream(this.options.fileName, {
			flags: 'a+',
			encoding: this.options.encoding
		});
	}

	/**
	 * Reads the size of the target log file path if it exists.
	 */
	protected readFileSize() {
		try {
			const stat = fs.statSync(this.options.fileName);
			this.currentFileSize = stat.size;
		}
		catch (_) {
			this.currentFileSize = 0;
		}
	}

	/**
	 * Rotates the current log file after writing the given content.
	 *
	 * @param content
	 * @returns
	 */
	protected rotate(content: string) {
		if (!this.options.rotation) {
			return;
		}

		const source = new PromiseCompletionSource<void>();

		const originalFileName = path.resolve(this.options.fileName);
		const rotationDir = path.resolve(this.options.rotation.dirName ?? path.dirname(originalFileName));

		const fileName = path.resolve(rotationDir, path.basename(this.options.fileName) + '.1');
		const stream = this.stream;

		// Handle the finish event
		stream.once('finish', async () => {
			// Ensure the dir exists
			if (!fs.existsSync(rotationDir)) {
				fs.promises.mkdir(rotationDir, { recursive: true });
			}

			// Clean old files
			// This will also bump rotation number suffixes
			await this.cleanRotationDir(rotationDir);

			// Move the file
			await fs.promises.rename(originalFileName, fileName);

			// Emit an event
			this.emit('rotated', {
				rotationDir,
				path: fileName,
				size: this.currentFileSize
			} as RotationFile);

			// Create a new stream
			this.stream = this.openFileStream();
			this.currentFileSize = 0;

			// Resolve
			source.setResult();
		});

		// Write the text chunk
		stream.end(content);

		return source.promise;
	}

	/**
	 * Cleans the log rotation directory of any expired log files, and bumps the rotation number suffixes to make room
	 * for a new #1.
	 *
	 * @param dirName
	 * @returns
	 */
	protected async cleanRotationDir(dirName: string) {
		try {
			if (!this.options.rotation) {
				return;
			}

			const files = await fs.promises.readdir(dirName);
			const prefix = path.basename(this.fileName) + '.';

			const archives = new Set<RotationArchive>();
			const todo = new Set<RotationArchive>();

			for (const fileName of files) {
				if (fileName.startsWith(prefix)) {
					const filePath = path.resolve(dirName, fileName);
					const suffix = fileName.substring(prefix.length);

					if (suffix.match(/^\d+$/)) {
						try {
							const number = +suffix;
							const stat = await fs.promises.stat(filePath);
							const timestamp = Math.floor(stat.mtimeMs ?? 0);

							if (timestamp <= 0) {
								continue;
							}

							archives.add({
								path: filePath,
								index: number,
								timestamp
							});
						}
						catch (_) {}
					}
				}
			}

			// Sort the archives from oldest to newest
			const sorted = new Set([...archives].sort((a, b) => (a.index > b.index) ? -1 : 1));

			// Apply the max archive count limiter
			if (this.options.rotation.maxArchiveCount > 0 && sorted.size >= this.options.rotation.maxArchiveCount) {
				const extra = sorted.size - this.options.rotation.maxArchiveCount + 1;
				const due = [...sorted].slice(0, extra);

				for (const archive of due) {
					todo.add(archive);
					sorted.delete(archive);
				}
			}

			// Apply the archive age limiter
			if (this.options.rotation.maxArchiveAge > 0) {
				const minAge = Date.now() - this.options.rotation.maxArchiveAge;

				for (const archive of [...sorted]) {
					if (archive.timestamp >= minAge) {
						break;
					}

					todo.add(archive);
					sorted.delete(archive);
				}
			}

			// Delete files
			if (todo.size > 0) {
				for (const archive of todo) {
					try {
						fs.promises.unlink(archive.path);
						this.emit('cleaned', archive);
					}
					catch (_) {}
				}
			}

			// Rename existing archives
			let newIndex = sorted.size + 1;
			for (const archive of sorted) {
				try {
					const currentName = archive.path;
					const newName = currentName.replace(/\.\d+$/, '.' + newIndex--);

					fs.promises.rename(currentName, newName);
				}
				catch (_) {}
			}
		}
		catch (_) {
			return;
		}
	}

	/**
	 * Returns the EOL character.
	 */
	protected get eol() {
		return this.options.eol === 'lf' ? "\n" : "\r\n";
	}

	/**
	 * The name or path of the log file.
	 */
	public get fileName() {
		return this.options.fileName;
	}

}

export interface FileTransportOptions {

	/**
	 * Customizes prefix options.
	 */
	prefixes?: PrefixGeneratorOptions;

	/**
	 * Customizes formatting options for messages.
	 */
	formatting?: InspectOptions;

	/**
	 * An absolute or relative path to the log file.
	 */
	fileName: string;

	/**
	 * The encoding to use for the log file.
	 * @default 'utf8'
	 */
	encoding?: BufferEncoding;

	/**
	 * The newline character to use. When not specified, defaults to the newline character for the current operating
	 * system.
	 */
	eol?: 'lf' | 'crlf';

	/**
	 * Customizes log rotation.
	 */
	rotation?: false | {
		/**
		 * A relative or absolute name of the directory to store. When not specified, it will use the same directory
		 * as the main log file.
		 */
		dirName?: string;

		/**
		 * The number of bytes at which the active log file will be archived.
		 *
		 * @default 5242880 // 5 MiB
		 */
		maxFileSize?: number;

		/**
		 * The maximum number of archived log files, after which the oldest files will be deleted automatically.
		 * Setting this to `0` will allow unlimited files.
		 *
		 * @default 50
		 */
		maxArchiveCount?: number;

		/**
		 * The maximum age of archived log files, in milliseconds, after which they will expire and be deleted
		 * automatically. Setting this to `0` will disable archive expiry.
		 *
		 * @default 2678400000
		 */
		maxArchiveAge?: number;
	}

}

type FileTransportEvents = {
	/**
	 * Emitted when the active log file is rotated and archived.
	 */
	rotated: [RotationFile];

	/**
	 * Emitted when an archived log file is deleted from the disk automatically.
	 */
	cleaned: [RotationArchive];
}

export interface RotationFile {
	rotationDir: string;
	path: string;
	size: number;
}

export interface RotationArchive {
	path: string;
	index: number;
	timestamp: number;
}
