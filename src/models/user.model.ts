const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const uniqueValidator = require('mongoose-unique-validator');
import { AbstractModel } from './abstract.model';

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
				default: 2
			},
			creationDate: {
				type: Date,
				default: Date.now
			}
		});

		this.schema.plugin(uniqueValidator, { message: 'ERROR' });
		this.schema.plugin(mongoosePaginate);
	}
}
