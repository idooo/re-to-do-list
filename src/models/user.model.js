const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const AbstractModel = require('./abstract.model');
const Constants = require('../constants');


class User extends AbstractModel {

	constructor () {
		super();
		this.schema = new mongoose.Schema({
			name: {
				type: String,
				trim: true,
				required: true
			},
			role: {
				type: String,
				default: Constants.ROLES.USER
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
