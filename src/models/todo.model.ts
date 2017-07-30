import * as mongoose from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate';
import * as uuid from 'node-uuid';
import { AbstractModel } from './abstract.model';
import * as moment from 'moment';

export const TODO_STATUS_TYPES = {
	DONE: 'DONE',
	OPEN: 'OPEN',
	ABANDON: 'ABANDON',
	IN_PROGRESS: 'IN_PROGRESS'
};

export const TODO_DATE_CODE_FORMAT = 'DDMMYYYY';

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
			list: {
				type: mongoose.Schema.Types.ObjectId,
				required: true,
				ref: 'List'
			},
			dateCode: {
				type: String,
				default: () => moment().format(TODO_DATE_CODE_FORMAT),
				index: true
			},
			creationDate: {
				type: Date,
				default: Date.now
			}
		});

		this.schema.plugin(mongoosePaginate);
	}
}
