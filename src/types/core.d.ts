import * as restify from 'restify';

interface IConfig {
	server?: {
		host?: string;
		port?: number;
	};
	debug?: Object;
	logs?: {
		level?: string;
		isJson?: boolean;
		file?: string;
	};
	database: IDatabaseConfig;
}

interface IDatabaseConfig {
	uri: string;
	port: number;
	db: string;
	username: string;
	password?: string;
	autoConnect: boolean;
}

interface IFormatterOptions {
	level: any;
	message: string;
	meta: {
		stack?: Object;
	};
}

declare namespace IServer {
	interface Request extends restify.Request {
		checkParams?: Function;
		sanitizeParams?: Function;
		getValidationResult?: Function;
		check?: Function;
		route: {
			method: string;
			path: string;
		};
	}

	interface Response extends restify.Response {
		req: Request;
	}

	interface Next extends restify.Next {}
}
