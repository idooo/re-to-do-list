import * as restify from 'restify';

interface IConfig {
	server: {
		host?: string;
		port?: number;
		catchUncaughtException?: false;
	};
	debug?: Object;
	logs?: {
		level?: string;
		isJson?: boolean;
		file?: string;
	};
	auth: {
		jwtSecret: string;
		successRedirectURL: string;
		providers: {
			auth0: IAuth0Config;
		};
	};
	database: IDatabaseConfig;
}

interface IAuth0Config {
	domain: string;
	clientID: string;
	clientSecret: string;
	callbackURL: string;
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
		stack?: any;
	};
}

declare namespace IServer {
	interface Request extends restify.Request {
		checkParams?: Function;
		sanitizeParams?: Function;
		getValidationResult?: Function;
		check?: Function;
		user?: any;
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
