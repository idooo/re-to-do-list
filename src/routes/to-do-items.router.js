const API_ITEMS_LIST = '/api/1.0/items';
const API_ADD_ITEM = '/api/1.0/item';
const API_ITEM = '/api/1.0/item/:id';
const LIST_PAGE_SIZE = 20;

const uuid = require('node-uuid');
const Router = require('./abstract.router');
const Constants = require('../constants');


class ToDoItemsRouter extends Router {

	configure () {

		/**
		 * @api {get} /api/1.0/items
		 * @apiName GetItems
		 * @apiGroup Items
		 * @apiVersion 1.0.0
		 *
		 * @apiDescription
		 *
		 * @apiParam {Object} [query] db query
		 * @apiParam {Object} [sort] db sort
		 */
		this.bindGET(API_ITEMS_LIST, this.routeItems, {
			auth: false,
			restrict: Constants.ROLES.USER
		});

		/**
		 * @api {post} /api/1.0/item Create an item
		 * @apiName AddItem
		 * @apiGroup Items
		 * @apiVersion 1.0.0
		 *
		 * @apiDescription
		 *
		 */
		this.bindPOST(API_ADD_ITEM, this.routeAddItem, {
			auth: false,
			restrict: Constants.ROLES.ADMIN
		});

		/**
		 * @api {put} /api/1.0/item Update an item
		 * @apiName UpdateItem
		 * @apiGroup Items
		 * @apiVersion 1.0.0
		 *
		 * @apiDescription
		 *
		 */
		this.bindPUT(API_ITEM, this.routeUpdateItem, {
			auth: false,
			restrict: Constants.ROLES.ADMIN
		});
	}

	routeItems (req, res, next) {
		let page = parseInt(req.params.p, 10) || 1;
		let query = req.params.query || {}; //@todo: unsafe - can get data for all users
		let sort = req.params.sort || {'_id': -1}; // sort by date, latest first by default
		let fields = '-__v -votes';

		this._models.ToDoItem.paginate(query, {
			page: page,
			sort: sort,
			limit: LIST_PAGE_SIZE,
			select: fields
		})
			.then(data => {
				Router.success(res, {
					items: data.docs,
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

	routeAddItem (req, res, next) {
		const item = new this._models.ToDoItem({
			text: Router.filter(req.params.text),
			uuid: Router.filter(req.params.uuid) || uuid.v4(),
			dateDelta: parseInt(req.params.dateDelta, 10) || undefined
			// author: 'ido_q'
		});

		item.save((err, item) => {
			if (err) {
				Router.fail(res, err);
				return next();
			}
			else {
				Router.success(res, {item});
				return next();
			}
		});
	}

	routeUpdateItem (req, res, next) {
		const id = this._models.ObjectId(req.params.id);
		const {status} = req.params;

		if (!id) {
			Router.fail(res, {message: Constants.ERROR_NOT_FOUND});
			return next();
		}

		this._models.ToDoItem.findOneAndUpdate({_id: id}, {status})
			.then(() => {
				Router.success(res);
				return next();
			})
			.catch(e => {
				Router.fail(res, e);
				return next();
			});
	}
}

module.exports = ToDoItemsRouter;
