const ROUTERS_PATH = `${__dirname}/routes`;
const STATIC_ROUTER = 'static.router.js';
const ABSTRACT_ROUTER = 'abstract.router.js';
const RE_DEBUG_LOG = /(^\/api\/|^\/\??$)/; // /api and /

const fs = require('fs');
const logger = require('winston');

class RouterLoader {

	constructor (server, config) {
		this._server = server;
		this._config = config;

		// Add debug logger to endpoints
		server.use(function (req, res, next) {
			if (RE_DEBUG_LOG.test(req.url)) logger.debug(req.method + ' ' + req.url);
			return next();
		});
	}

	loadRouters () {
		const files = fs.readdirSync(ROUTERS_PATH);

		files
			// Exclude some routes (static and abstract)
			.filter(filename => {
				return /.*\.router\.js/.test(filename)
					&& [STATIC_ROUTER, ABSTRACT_ROUTER].indexOf(filename) === -1;
			})
			.forEach(filename => this.loadRouter(filename));
	}

	loadRouter (routeName) {
		logger.debug(`Loading route ${routeName}...`);
		const Router = require(`${ROUTERS_PATH}/${routeName}`);
		new Router(this._server, this._config).configure();
	}
}

module.exports = RouterLoader;
