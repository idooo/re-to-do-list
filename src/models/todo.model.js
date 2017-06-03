const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const uuid = require('node-uuid');

// Will add the UUID type to the Mongoose Schema types
require('mongoose-uuid2')(mongoose);

const AbstractModel = require('./abstract.model');
const Constants = require('../constants');


class ToDoItem extends AbstractModel {

	constructor () {
		super();
		this.schema = new mongoose.Schema({
			text: {
				type: String,
				trim: true,
				required: true
			},
			status: {
				type: String,
				default: Constants.TODO_TYPES.OPEN,
				enum: Object.keys(Constants.TODO_TYPES),
				required: true
			},
			uuid: {
				type: mongoose.Types.UUID,
				default: uuid.v4
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

module.exports = ToDoItem;
