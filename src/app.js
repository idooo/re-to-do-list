const assert = require('assert');
const path = require('path');
const fs = require('fs');
const tv4 = require('tv4');
const restify = require('restify');

const Database = require('./database');
const RouterLoader = require('./router');
const {ConfigurationParseError} = require('./errors');

const ROUTERS_PATH = `${__dirname}/routes`;
const CONFIG_SCHEMA = require('../config/config.schema.json');


class Application {

	/**
	 * @param {String} configName
	 */
	constructor (configName) {
		assert(configName, 'configName (type String) parameter must be passed to Application constructor');
		try {
			this._config = Application.validateConfig(require(configName));
			this._config.debug = this._config.debug || {};
		}
		catch (ex) {
			console.error(`Error! Cannot find config file '${process.env.config}'. Existing now...`, ex); // eslint-disable-line no-console
			process.exit(1);
		}

		this._logger = require('./logging')(this._config);
		Object.freeze(this._config);

		if (Object.keys(this._config.debug).length) {
			this._logger.warn('One or more debug options enabled! Don\'t do it in production please!');
			Object.keys(this._config.debug).forEach(key => this._logger.warn(`${key} debug option enabled`));
		}

		// Web server
		this._server = restify.createServer({});
		this.setupWebServer();

		// Connect to DB and load model
		const db = new Database(this._config.database);
		this._model = db.loadModel();

		// Routing
		new RouterLoader(this._server, this._config).loadRouters();

	}

	get server () {
		return this._server;
	}

	get config () {
		return this._config;
	}

	get model () {
		return this._model;
	}

	/**
	 * Runs a worker process that attempts to read from queue,
	 * downloads test from S3, executes them and sends notification if needed
	 * ¯\_(ツ)_/¯
	 */
	start () {
		this._logger.debug('Server has been started');

		this._server.listen(
			this._config.server.port || 8080,
			this._config.server.host || 'localhost',
			() => this._logger.info('Server is listening at %s', this._server.url)
		);
	}

	setupWebServer () {
		// Setup server
		this._server.use(restify.bodyParser({mapParams: true}));
		this._server.use(restify.queryParser());

		// Global uncaughtException Error Handler
		this._server.on('uncaughtException', (req, res, route, error) => {
			this._logger.warn('uncaughtException', route, error.stack.toString());

			res.send(500, {
				error: 'INTERNAL_ERROR',
				status: 'error'
			});
		});

		this._server.use((req, res, next) => {
			// Add debug logger for /api/ endpoints
			if (/\/api\/.*/.test(req.url)) {
				this._logger.debug(`${req.method} ${req.url}`);
			}

			// Add CORS headers
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'X-Requested-With');

			return next();
		});
	}

	/**
	 * Validates config against a JSON schema, throws an error if validation failed
	 * @param {Object} config
	 * @returns {Object}
	 */
	static validateConfig (config) {
		const valid = tv4.validate(config, CONFIG_SCHEMA);
		if (!valid) {
			throw new ConfigurationParseError(tv4.error.message);
		}
		return config;
	}
}

module.exports = Application;
