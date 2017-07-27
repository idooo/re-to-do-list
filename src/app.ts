import * as restify from 'restify'
import * as assert from "assert";
import * as fs from "fs";
import {Winston} from "winston";
import * as corsMiddleware from 'restify-cors-middleware';

import {LoggerInitialisation} from './logging';
import {Database} from "./database";
import {StatusRouter} from "./routes/status.router";
import {UserRouter} from "./routes/users.router";
import {ToDoListRouter} from "./routes/todolist.router";


export class Application {

	private config: IConfig;
	private logger: Winston;
	private server: restify.Server;
	private database: Database;

	/**
	 * @param {String} configName
	 */
	constructor (configName: string) {
		assert(configName, 'configName (type String) parameter must be passed to Application constructor');
		try {
			this.config = JSON.parse(fs.readFileSync(configName).toString());
			this.config.debug = this.config.debug || {};
		}
		catch (ex) {
			console.error(`Error! Cannot find config file '${process.env.config}'. Existing now...`, ex);
			process.exit(1);
		}

		this.logger = LoggerInitialisation(this.config);
		Object.freeze(this.config);

		if (Object.keys(this.config.debug).length) {
			this.logger.warn('One or more debug options enabled! Don\'t do it in production please!');
			Object.keys(this.config.debug).forEach(key => this.logger.warn(`${key} debug option enabled`));
		}

		// Web server
		this.server = restify.createServer({});
		this.setupWebServer();

		// Connect to DB and load model
		this.database = new Database(this.config.database);

		// Routing
		new StatusRouter(this.server, this.config);
		new UserRouter(this.server);
		new ToDoListRouter(this.server);
	}


	start () {
		this.logger.debug('Server has been started');

		this.server.listen(
			this.config.server.port || 8080,
			this.config.server.host || 'localhost',
			() => this.logger.info('Server is listening at %s', this.server.url)
		);
	}

	setupWebServer () {
		// Setup server
		this.server.use(restify.plugins.bodyParser({mapParams: true}));
		this.server.use(restify.plugins.queryParser());

		// Global uncaughtException Error Handler
		this.server.on('uncaughtException', (
			req: restify.Response,
			res: restify.Response,
			route: Object,
			error: Error
		) => {
			this.logger.warn('uncaughtException', route, error.stack.toString());

			res.send(500, {
				error: 'INTERNAL_ERROR',
				status: 'error'
			});
		});

		this.server.use((req: restify.Request, res: restify.Response, next: restify.Next) => {
			// Add debug logger for /api/ endpoints
			if (/\/api\/.*/.test(req.url)) {
				this.logger.debug(`${req.method} ${req.url}`);
			}

			return next();
		});

		const cors = corsMiddleware({
			origins: ['http://localhost:*'],
		});

		this.server.pre(cors.preflight);
		this.server.use(cors.actual);
	}
}

