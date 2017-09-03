import { Server } from 'restify';
import * as jwt from 'express-jwt';
import { AbstractRouter } from './abstract.router';
import { IConfig, IServer } from '../types/core';

const FIELDS_TO_MASK = ['password', 'database', 'auth'];

export class StatusRouter extends AbstractRouter {
	constructor(server: Server, private config: IConfig) {
		super();
		server.get('/api/1.0/status', this.routeStatus.bind(this));
	}

	routeStatus(req: IServer.Request, res: IServer.Response) {
		const sanitisedConfig = StatusRouter.maskFields(
			JSON.parse(JSON.stringify(this.config)),
			FIELDS_TO_MASK
		);
		this.success(res, {
			config: sanitisedConfig,
			status: 'healthy'
		});
	}

	/**
	 * @description
	 * Recursively masks fields in object
	 */
	static maskFields(object: Object, fields: Array<string>): Object {
		Object.keys(object).forEach(propertyName => {
			if (fields.indexOf(propertyName) !== -1) object[propertyName] = '******';
			else if (
				typeof object[propertyName] === 'object' &&
				!Array.isArray(object)
			) {
				object[propertyName] = StatusRouter.maskFields(
					object[propertyName],
					fields
				);
			}
		});
		return object;
	}
}
