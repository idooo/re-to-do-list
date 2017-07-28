import * as logger from 'winston';

export class AbstractModel {
	public name: string;
	public schema: any;

	constructor() {
		this.name = this.constructor.name;
		logger.debug('Schema has been loaded');
	}
}
