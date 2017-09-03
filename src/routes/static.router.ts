import * as restify from 'restify';
import * as path from 'path';

export class StaticRouter {

	constructor (server: restify.Server) {

		server.get(/^(?!\/api).*/, restify.plugins.serveStatic({
			directory: path.normalize(__dirname + '/../../public'),
			default: '/index.html'
		}));
	}
}

