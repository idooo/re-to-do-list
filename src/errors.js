/**
 * Class that allows us to extend errors using ES6
 * @link http://stackoverflow.com/questions/31089801/extending-error-in-javascript-with-es6-syntax
 */
class ExtendableError extends Error {

	constructor (message) {
		super(message);
		this.name = this.constructor.name;
		this.message = message;
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		}
		else {
			this.stack = (new Error(message)).stack;
		}
	}
}

/**
 * List of custom errors
 */

class ConfigurationParseError extends ExtendableError {}

module.exports = {
	ConfigurationParseError
};
