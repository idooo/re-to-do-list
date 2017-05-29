const API_USERS_LIST = '/api/users';
const LIST_PAGE_SIZE = 20;

const Router = require('./abstract.router');
const Constants = require('../constants');


class UsersRouter extends Router {

	configure () {

		/**
		 * @api {get} /api/users Get list of users
		 * @apiName GetUser
		 * @apiGroup User
		 * @apiPermission ADMIN
		 * @apiVersion 1.0.0
		 *
		 * @apiDescription
		 * Allowed only for admin
		 *
		 * @apiParam {Object} [query] db query
		 * @apiParam {Object} [sort] db sort
		 */
		this.bindGET(API_USERS_LIST, this.routeUsers, {
			auth: false,
			restrict: Constants.ROLES.ADMIN
		});
	}

	routeUsers (req, res, next) {
		let page = parseInt(req.params.p, 10) || 1;
		let query = req.params.query || {};
		let sort = req.params.sort || {'_id': -1}; // sort by date, latest first by default
		let fields = '-__v -votes';

		this._models.User.paginate(query, {
			page: page,
			sort: sort,
			limit: LIST_PAGE_SIZE,
			select: fields
		})
			.then(data => {
				Router.success(res, {
					users: data.docs,
					pageCount: data.pages,
					itemCount: data.total,
					currentPage: data.page
				});
				return next();
			})
			.catch(function (err) {
				Router.fail(res, err);
				return next();
			});
	}

}

module.exports = UsersRouter;
