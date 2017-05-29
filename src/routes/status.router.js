const API_STATUS = '/api/1.0/status';
const Router = require('./abstract.router');

const FIELDS_TO_MASK = [
	'password',
	'database'
];

class StatusRouter extends Router {

	configure () {

		/**
		 * @api {get} /api/1.0/status Status
		 * @apiName Status
		 * @apiGroup Information
		 * @apiVersion 1.0.0
		 */
		this.bindGET(API_STATUS, this.routeStatus);
	}

	routeStatus (req, res) {
		const sanitisedConfig = StatusRouter.maskFields(JSON.parse(JSON.stringify(this._config)), FIELDS_TO_MASK);
		Router.success(res, {
			config: sanitisedConfig
		});
	}

	/**
	 * @description
	 * Recursively masks fields in object
	 *
	 * @param {Object} object
	 * @param {Array<String>} fields List of field names to mask
	 * @returns {Object}
	 */
	static maskFields (object, fields) {
		Object.keys(object).forEach(propertyName => {
			if (fields.indexOf(propertyName) !== -1) object[propertyName] = '******';
			else if (typeof object[propertyName] === 'object' && !Array.isArray(object)) {
				object[propertyName] = StatusRouter.maskFields(object[propertyName], fields);
			}
		});
		return object;
	}
}

module.exports = StatusRouter;
