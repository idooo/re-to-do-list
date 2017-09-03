import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { AbstractModel } from './abstract.model';

export class ToDoList extends AbstractModel {
	constructor() {
		super();
		this.schema = new mongoose.Schema({
			name: {
				type: String,
				trim: true,
				required: true
			},
			user: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
				ref: 'User'
			},
			creationDate: {
				type: Date,
				default: Date.now
			}
		});

		this.schema.plugin(mongoosePaginate);
	}
}
