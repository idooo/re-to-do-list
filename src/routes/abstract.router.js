const util = require('util');
const logger = require('winston');

const Database = require('../database');
const Constants = require('../constants');

const RE_FILTER = /[^a-zA-Z0-9\s#_\-\)\(\.]+/g;
const RE_PRETTIFY_ERROR = /\(?`?\{(PATH|VALUE)}`?\)?/ig;
const DEFAULT_ROUTE_OPTIONS = {
	auth: false
};

class Router {

	constructor (server, config) {
		this._server = server;
		this._config = config;
		this._models = new Database().models;
		logger.debug('Router has been loaded');
	}

	bindGET (url, route, options) {
		this.bind(url, 'get', route, options);
	}

	bindPOST (url, route, options) {
		this.bind(url, 'post', route, options);
	}

	bindPUT (url, route, options) {
		this.bind(url, 'put', route, options);
	}

	bindHEAD (url, route, options) {
		this.bind(url, 'head', route, options);
	}

	bindDELETE (url, route, options) {
		this.bind(url, 'del', route, options);
	}

	/**
	 * Binds router function to route url with additional options.
	 * Options object:
	 * {
	 *     auth: <boolean>,
	 *     restrict: <number>
	 * }
	 *
	 * @param {String} url
	 * @param {String} methodName
	 * @param {Function} route
	 * @param {Object} [options]
	 */
	bind (url, methodName, route, options) {
		let wrapper = route.bind(this);

		options = util._extend(util._extend({}, DEFAULT_ROUTE_OPTIONS), options || {});

		// Auth
		if (options.auth) {
			wrapper = this.wrapAuth(route, options.restrict || Constants.ROLES.USER);
		}
		this._server[methodName](url, wrapper);
	}


	/**
	 * Sends success response to the user
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 */
	static success (res, data) {
		if (typeof data === 'undefined' || data === null) data = {};
		data.status = 'ok';
		res.send(200, data);
	}

	/**
	 * Sends error response to the user
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 * @param {Number} [code=400] error code
	 */
	static fail (res, data, code) {
		data = data || {};
		code = code || 400;

		if (data.name === 'MongoError') {
			code = 500;
			data = {error: data.err};
		}
		else if (data.name === 'ValidationError') {
			const errors = {};

			// @todo: fix error messages
			errors.fields = Object.keys(data.errors);
            //
			// for (let fieldName of Object.keys(data.errors)) {
			// 	console.log(data.errors)
			// 	errors[fieldName] = data.errors[fieldName].properties.message.replace(RE_PRETTIFY_ERROR, fieldName);
			// }
			logger.error(data);
			data = {message: errors};
		}

		data.status = 'error';
		data.code = code;

		res.send(code, data);
	}

	/**
	 * Sends 404 error response to the user with NOT FOUND message
	 * @param {Object} res response object
	 * @param {Object} next
	 * @param {Object} id object that not found to show to the user
	 * @returns {*}
	 */
	static notFound (res, next, id) {
		logger.info(`${Constants.ERROR_NOT_FOUND} "${id}"`);
		Router.fail(res, {message: Constants.ERROR_NOT_FOUND}, 404);
		return next();
	}

	/**
	 * Attempts to parse request body to get JS object
	 * @param {Object} req request object
	 * @returns {{}}
	 */
	static body (req) {
		try {
			return JSON.parse(req.body);
		}
		catch (e) {
			return {};
		}
	}

	/**
	 * Attempts to filter incoming string. Returns null if string null or undefined.
	 * Otherwise returns trimmed and sanitised version of the string
	 * @param {String} str
	 * @returns {*}
	 */
	static filter (str) {
		if (str === null || str === undefined) return null;
		return (str.toString() || '').trim().replace(RE_FILTER, '').replace(/(\s+|\t+)/g, ' ');
	}

}
module.exports = Router;

