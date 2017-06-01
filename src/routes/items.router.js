const API_ITEMS_LIST = '/api/1.0/items';
const API_ITEMS = '/api/1.0/item';
const LIST_PAGE_SIZE = 20;

const Router = require('./abstract.router');
const Constants = require('../constants');


class ItemsRouter extends Router {

	configure () {

		/**
		 * @api {get} /api/1.0/items
		 * @apiName GetItems
		 * @apiGroup Items
		 * @apiVersion 1.0.0
		 *
		 * @apiDescription
		 * Allowed only for admin
		 *
		 * @apiParam {Object} [query] db query
		 * @apiParam {Object} [sort] db sort
		 */
		this.bindGET(API_ITEMS_LIST, this.routeItems, {
			auth: false,
			restrict: Constants.ROLES.USER
		});

		// /**
		//  * @api {post} /api/1.0/user Create a user
		//  * @apiName AddUser
		//  * @apiGroup User
		//  * @apiVersion 1.0.0
		//  *
		//  * @apiDescription
		//  * For testing purposes only
		//  */
		// this.bindPOST(API_USER, this.routeAddUser, {
		// 	auth: false,
		// 	restrict: Constants.ROLES.ADMIN
		// });
	}

	routeItems (req, res, next) {
		let page = parseInt(req.params.p, 10) || 1;
		let query = req.params.query || {};
		let sort = req.params.sort || {'_id': -1}; // sort by date, latest first by default
		let fields = '-__v -votes';

		this._models.Items.paginate(query, {
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

	routeAddUser (req, res, next) {
		const user = new this._models.User({
			name: Router.filter(req.params.name),
			role: parseInt(req.params.role, 10) || Constants.ROLES.USER
		});

		user.save((err, createdUser) => {
			if (err) {
				Router.fail(res, err);
				return next();
			}
			else {
				Router.success(res, createdUser);
				return next();
			}
		});
	}
}

module.exports = ItemsRouter;