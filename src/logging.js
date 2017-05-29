const winston = require('winston');


/**
 * @description
 * Configuration for logger with some custom pretty formatting
 *
 * @param {Object} config
 * @return {Object}
 */
module.exports = function Logger (config) {

	// Default file logger settings
	const filenameLoggerSettings = {
		level: (config.logs || {}).level,
		json: !!(config.logs || {}).isJson,
		filename: (config.logs || {}).file || `${__dirname}/../tmp/server.log`
	};

	// Reset console logger
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		timestamp,
		level: (config.logs || {}).level,
		colorize: true,
		formatter (options) {
			return winston.config.colorize(options.level, (options.level.toUpperCase() + '  ').slice(0, 5))
				+ ': ' + this.timestamp() + ' - ' + options.message + getMeta(options);
		}
	});

	// Pick one of the two logging outputs (JSON or plain file)
	if ((config.logs || {}).isJson) {
		winston.add(winston.transports.File, filenameLoggerSettings);
	}
	else {
		winston.add(winston.transports.File, Object.assign({}, filenameLoggerSettings, {
			timestamp,
			formatter (options) {
				return this.timestamp() + ' - ' + (options.level.toUpperCase() + '  ').slice(0, 5)
					+ ' [process ' + process.pid + '] - ' + options.message + getMeta(options);
			}
		}));
	}

	function getMeta (options = {}) {
		if (Object.keys(options.meta || {}).length) {
			if (options.meta.stack) {
				return (options.message ? ' - ' : '') + options.meta.stack;
			}
			return ' - ' + JSON.stringify(options.meta);
		}
		return '';
	}

	/**
	 * Human readable timestamp
	 */
	function timestamp () {
		const date = new Date();
		return ('0' + date.getHours()).slice(-2) + ':'
			+ ('0' + date.getMinutes()).slice(-2) + ':'
			+ ('0' + date.getSeconds()).slice(-2) + '.'
			+ ('00' + date.getMilliseconds()).slice(-3) + ' '
			+ ('0' + date.getDate()).slice(-2) + '/'
			+ ('0' + (date.getMonth() + 1)).slice(-2);
	}

	return winston;
};
