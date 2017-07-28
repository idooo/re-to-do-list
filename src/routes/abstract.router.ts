import * as logger from 'winston';
import { Database } from '../database';
import { ValidationError } from '../errors';
import { IServer } from '../types/core';


export class AbstractRouter {
	public model: any = Database.model;

	/**
	 * Sends success response to the user
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 */
	success(res: IServer.Response, data: any = {}) {
		data.status = 'ok';
		res.send(200, data);
	}

	/**
	 * Sends error response to the user
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 * @param {Number} [code=400] error code
	 */
	fail(res: IServer.Response, data: any = {}, code: Number = 400) {
		let responseData = {
			code,
			status: 'error'
		};

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
		} else {
			responseData = { ...responseData, ...data };
		}
		res.send(code, responseData);
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
