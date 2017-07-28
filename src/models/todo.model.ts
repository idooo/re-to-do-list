import * as mongoose from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate';
import * as uuid from 'node-uuid';
import { AbstractModel } from './abstract.model';

export const TODO_STATUS_TYPES = {
	DONE: 'DONE',
	OPEN: 'OPEN',
	ABANDON: 'ABANDON',
	IN_PROGRESS: 'IN_PROGRESS'
};

export class ToDoItem extends AbstractModel {
	constructor() {
		super();
		this.schema = new mongoose.Schema({
			text: {
				type: String,
				trim: true,
				required: true
			},
			status: {
				type: String,
				default: TODO_STATUS_TYPES.OPEN,
				enum: Object.keys(TODO_STATUS_TYPES),
				required: true
			},
			uuid: {
				type: String,
				default: uuid.v4,
				index: true
			},
			author: {
				type: mongoose.Schema.Types.ObjectId,
				required: false // @todo required
			},
			dateDelta: {
				type: Number,
				default: 0
			},
			creationDate: {
				type: Date,
				default: Date.now
			}
		});

		this.schema.plugin(mongoosePaginate);
	}
}
