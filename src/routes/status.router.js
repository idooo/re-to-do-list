const ResponseHelper = require('../helpers/response');
const Router = require('./abstract.router');

const FIELDS_TO_MASK = [
	'password',
	'database'
];

class StatusRouter extends Router {

	configure () {

		/**
		 * @api {get} /api/status Status
		 * @apiName Status
		 * @apiGroup Information
		 * @apiVersion 1.0.0
		 */
		this.bindGET('/api/status', this.routeStatus);
	}

	routeStatus (req, res) {
		const sanitisedConfig = ResponseHelper.maskFields(JSON.parse(JSON.stringify(this._config)), FIELDS_TO_MASK);
		ResponseHelper.success(res, {
			status: 'ok',
			config: sanitisedConfig
		});
	}
}

module.exports = StatusRouter;
