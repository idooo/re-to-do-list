import { Request, Response } from 'restify';
import * as logger from 'winston';
import { Database } from '../database';

const RE_FILTER = /[^a-zA-Z0-9\s#_\-\)\(\.]+/g;

export class AbstractRouter {
	public model: any = Database.model;

	/**
	 * Sends success response to the user
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 */
	success(res: Response, data: any = {}) {
		data.status = 'ok';
		res.send(200, data);
	}

	/**
	 * Sends error response to the user
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 * @param {Number} [code=400] error code
	 */
	fail(res: Response, data: any = {}, code: Number = 400) {
		data.status = 'error';
		data.code = code;
		res.send(code, data);
	}

	/**
	 * Attempts to parse request body to get JS object
	 * @param {Object} req request object
	 * @returns {{}}
	 */
	static body(req) {
		try {
			return JSON.parse(req.body);
		} catch (e) {
			return {};
		}
	}

	/**
	 * Attempts to filter incoming string. Returns null if string null or undefined.
	 * Otherwise returns trimmed and sanitised version of the string
	 * @param {String} str
	 * @returns {*}
	 */
	static filter(str) {
		if (str === null || str === undefined) return null;
		return (str.toString() || '')
			.trim()
			.replace(RE_FILTER, '')
			.replace(/(\s+|\t+)/g, ' ');
	}
}
