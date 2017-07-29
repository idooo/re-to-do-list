import * as restify from 'restify';
import * as expressValidator from 'express-validator';
import * as assert from 'assert';
import * as fs from 'fs';
import * as corsMiddleware from 'restify-cors-middleware';
import { Winston } from 'winston';

import { IConfig, IServer } from './types/core';
import { LoggerInitialisation } from './logging';
import { Database } from './database';
import { StatusRouter } from './routes/status.router';
import { UserRouter } from './routes/users.router';
import { toDateCodeSanitiser, ToDoItemRouter } from './routes/item.router';
import { toObjectIdSanitiser } from "./models/abstract.model";
import { INTERNAL_ERROR } from "./routes/abstract.router";
import { AuthRouter } from './routes/auth.router';
import { Authentication } from "./auth";

export class Application {
	private config: IConfig;
	private logger: Winston;
	private server: restify.Server;
	private database: Database;

	private customValidators = {};

	private customSanitizers = {
		toObjectId: toObjectIdSanitiser,
		toDateCode: toDateCodeSanitiser
	};

	/**
	 * @param {String} configName
	 */
	constructor(configName: string) {
		assert(
			configName,
			'configName (type String) parameter must be passed to Application constructor'
		);
		try {
			this.config = JSON.parse(fs.readFileSync(configName).toString());
			this.config.debug = this.config.debug || {};
		} catch (ex) {
			console.error(
				`Error! Cannot find config file '${process.env
					.config}'. Existing now...`,
				ex
			);
			process.exit(1);
		}

		this.logger = LoggerInitialisation(this.config);
		Object.freeze(this.config);

		if (Object.keys(this.config.debug).length) {
			this.logger.warn(
				"One or more debug options enabled! Don't do it in production please!"
			);
			Object.keys(this.config.debug).forEach(key =>
				this.logger.warn(`${key} debug option enabled`)
			);
		}

		// Web server
		this.server = restify.createServer({});

		new Authentication(this.server, this.config);
		this.setupWebServer();

		// Connect to DB and load model
		this.database = new Database(this.config.database);

		// Routing
		new AuthRouter(this.server, this.config);
		new StatusRouter(this.server, this.config);
		new UserRouter(this.server);
		new ToDoItemRouter(this.server);
	}

	start() {
		this.logger.debug('Server has been started');

		this.server.listen(
			this.config.server.port || 8080,
			this.config.server.host || 'localhost',
			() => this.logger.info('Server is listening at %s', this.server.url)
		);
	}

	setupWebServer() {
		// Setup server
		this.server.use(restify.plugins.bodyParser({mapParams: true}));
		this.server.use(
			<any>expressValidator({
				customValidators: this.customValidators,
				customSanitizers: this.customSanitizers
			})
		);
		this.server.use(restify.plugins.queryParser());

		if (this.config.server.catchUncaughtException) {
			// Global uncaughtException Error Handler
			this.server.on(
				'uncaughtException',
				(req: IServer.Response,
				 res: IServer.Response,
				 route: Object,
				 error: Error) => {
					this.logger.warn('uncaughtException', route, error.stack.toString());

					res.send(500, {
						error: INTERNAL_ERROR
					});
				}
			);
		}

		this.server.use(
			(req: IServer.Request, res: IServer.Response, next: IServer.Next) => {
				// Add debug logger for /api/ endpoints
				if (/\/api\/.*/.test(req.url)) {
					this.logger.debug(`${req.method} ${req.url} - auth: ${(req.user || {})._id}`);
				}
				return next();
			}
		);

		const cors = corsMiddleware({
			origins: ['http://localhost:*'],
			allowHeaders: ['Authorization'],
		});

		this.server.pre(cors.preflight);
		this.server.use(cors.actual);
	}
}
