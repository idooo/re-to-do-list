import * as logger from 'winston';
import { Types } from "mongoose";

export function toObjectIdSanitiser (value) {
	try {
		value = Types.ObjectId(value);
	} catch (e) {
		// nothing
	}
	return value;
}

export class AbstractModel {
	public name: string;
	public schema: any;

	constructor() {
		this.name = this.constructor.name;
		logger.debug(`Schema ${this.name} has been loaded`);
	}
}
