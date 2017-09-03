import * as logger from 'winston';
import { Database } from '../database';
import { NotFoundError, ValidationError } from '../errors';
import { IServer } from '../types/core';
import { MongoError } from 'mongodb';


export const INTERNAL_ERROR = 'INTERNAL_ERROR';

export class AbstractRouter {
	public model: any = Database.model;

	/**
	 * Sends success response to the user
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 */
	success(res: IServer.Response, data: any = {}) {
		res.send(200, data);
	}

	/**
	 * Sends error response to the user, handles validation and internal errors output
	 *
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 * @param {Number} [code=400] error code
	 */
	fail(res: IServer.Response, data: any = {}, code: Number = 400) {
		let responseData = {
			code
		};

		// Restify and Mongoose validation errors handling
		if (data.name === ValidationError.name) {
			if (data.errors) {
				responseData['details'] = {};
				for (let fieldName of Object.keys(data.errors)) {
					responseData['details'][fieldName] =
						data.errors[fieldName].properties;
					responseData['details'][fieldName]['name'] =
						responseData['details'][fieldName]['path'];
					delete responseData['details'][fieldName]['path'];
				}
			} else {
				responseData = { ...responseData, ...data };
			}
			delete responseData['name'];
			logger.info(
				`Validation Error: ${res.req.route.method} ${res.req.route.path}`,
				responseData['details']
			);
			return res.send(code, responseData);
		}

		// Pretty common errors
		if (data.name === NotFoundError.name) {
			logger.warn(`${res.req.route.method} ${res.req.route.path}: ${data}`);
			return res.send(404, {
				message: data.message
			});
		}

		// Unhandled and handled database errors handling will be treated as internal errors
		if (data.name === MongoError.name) {
			(<any>responseData) = {
				code: 500,
				error: INTERNAL_ERROR
			};
		}
		else {
			responseData = {...responseData, ...data};
		}

		if (data.stack) {
			logger.error(
				`Internal Error: ${res.req.route.method} ${res.req.route.path}`,
				data.stack
			);
		}
		return res.send(404, responseData);
	}

	/**
	 * Executes validation against the request
	 * @param {IServer.Request} req
	 * @returns {Promise<any>}
	 */
	validate(req: IServer.Request): Promise<any> {
		return req.getValidationResult().then(result => {
			if (!result.isEmpty()) {
				throw new ValidationError(result.mapped());
			}
		});
	}

}
