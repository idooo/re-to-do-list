const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const uniqueValidator = require('mongoose-unique-validator');
import { AbstractModel } from './abstract.model';

export const ROLE = {
	USER: 2,
	ADMIN: 10
};

export class User extends AbstractModel {
	constructor() {
		super();
		this.schema = new mongoose.Schema({
			name: {
				type: String,
				trim: true,
				required: true,
				unique: true
			},
			role: {
				type: String,
				default: ROLE.USER
			},
			creationDate: {
				type: Date,
				default: Date.now
			}
		});

		this.schema.plugin(uniqueValidator, { message: 'Value is already exist' });
		this.schema.plugin(mongoosePaginate);
	}
}
