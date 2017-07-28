import * as logger from 'winston';
import * as mongoose from 'mongoose';

import { ToDoItem } from './models/todo.model';
import { User } from './models/user.model';
import { DatabaseConnectionError } from './errors';
import { IDatabaseConfig } from './types/core';

let instance = null;

/** singleton */
export class Database {
	private isConnected: boolean = false;
	public static model = {};

	constructor(private config: IDatabaseConfig) {
		if (instance) return instance;
		instance = this;

		this.connect();
	}

	connect() {
		const options = {
			db: { native_parser: true },
			server: { poolSize: 5 }
		};

		if (this.config && this.config.username) {
			logger.info('DB Auth enabled');
			options['user'] = this.config.username;
			options['pass'] = this.config.password;
		}

		mongoose.connect(
			`${this.config.uri}:${this.config.port}/${this.config.db}`,
			options
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

		this.loadModel();
	}

	loadModel() {
		// load models
		const models = {
			ToDoItem: ToDoItem,
			User: User
		};

		for (let modelName in models) {
			const schemaDefinition = new models[modelName]();
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
