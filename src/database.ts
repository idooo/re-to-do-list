import * as logger from 'winston';
import * as mongoose from 'mongoose';

import { IDatabaseConfig } from './types/core';
import { DatabaseConnectionError } from './errors';
import { ToDoItem } from './models/todo.model';
import { User } from './models/user.model';
import { ToDoList } from "./models/list.model";

let instance = null;

/** singleton */
export class Database {
	private isConnected: boolean = false;
	public static model = {
		ToDoItem: ToDoItem,
		User: User,
		ToDoList: ToDoList
	};

	constructor(private config: IDatabaseConfig) {
		if (instance) return instance;
		instance = this;

		this.connect();
	}

	connect() {
		let authString = '';

		if (this.config && this.config.username) {
			logger.info('DB Auth enabled');
			authString = `${this.config.username}:${this.config.password}@`;
		}

		mongoose.connect(
			`mongodb://${authString}${this.config.uri}:${this.config.port}/${this.config.db}`,
			{useMongoClient: true}
		);

		mongoose.connection
			.on('error', err => {
				throw new DatabaseConnectionError(err);
			})
			.once('open', () => {
				this.isConnected = true;
				(<any>mongoose).Promise = global.Promise;
				logger.info(`DB connected ${this.config.uri}/${this.config.db}`);
			});

		Database.loadModel();
	}

	private static loadModel() {
		for (let modelName in Database.model) {
			const schemaDefinition = new Database.model[modelName]();
			Database.model[schemaDefinition.name] = mongoose.model(
				schemaDefinition.name,
				schemaDefinition.schema
			);
		}
	}

	clean() {
		Object.keys(Database.model).forEach(modelName => {
			if (typeof Database.model[modelName].remove === 'undefined') return;
			Database[modelName].remove({}, () =>
				logger.warn(modelName + ' collection was removed')
			);
		});
	}
}
