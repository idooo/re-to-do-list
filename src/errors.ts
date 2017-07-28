/**
 * Class that allows us to extend errors using ES6
 * @link http://stackoverflow.com/questions/31089801/extending-error-in-javascript-with-es6-syntax
 */
class ExtendableError extends Error {
	public details: any;

	constructor(message, details = {}) {
		super(message);
		this.details = details;
		this.name = this.constructor.name;
		this.message = message;
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = new Error(message).stack;
		}
	}
}

/**
 * List of custom errors
 */

export class ConfigurationParseError extends ExtendableError {}

export class DatabaseConnectionError extends ExtendableError {}

export class ValidationError extends ExtendableError {
	constructor(details = {}) {
		super('ValidationError', details);
	}
}
