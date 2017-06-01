const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const uuid = require('node-uuid');

// Will add the UUID type to the Mongoose Schema types
require('mongoose-uuid2')(mongoose);

const AbstractModel = require('./abstract.model');
const Constants = require('../constants');


class User extends AbstractModel {

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
				default: Constants.ROLES.USER,
				enum: Object.keys(Constants.TODO_TYPES)
			},
			uuid: {
				type: mongoose.Types.UUID,
				default: uuid.v4
			},
			author: {
				type: mongoose.Schema.Types.ObjectId,
				required: true
			},
			creationDate: {
				type: Date,
				default: Date.now
			}
		});

		this.schema.plugin(mongoosePaginate);
	}
}

module.exports = User;
