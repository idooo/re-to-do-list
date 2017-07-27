import { Server, Request, Response } from 'restify';
import { AbstractRouter } from './abstract.router';
import * as logger from 'winston';
import * as uuid from 'uuid';
import { Database } from '../database';

export class ToDoListRouter extends AbstractRouter {
	constructor(server: Server) {
		super();
		server.get('/api/1.0/items', this.getItems.bind(this));
		server.post('/api/1.0/item', this.addItem.bind(this));
		server.put('/api/1.0/item/:id', this.updateItem.bind(this));
	}

	getItems(req: Request, res: Response, next) {
		let page = parseInt(req.params.p, 10) || 1;
		let query = req.params.query || {}; //@todo: unsafe - can get data for all users
		let sort = req.params.sort || { _id: -1 }; // sort by date, latest first by default
		let fields = '-__v -votes';

		this.model.ToDoItem
			.paginate(query, {
				page: page,
				sort: sort,
				limit: 20,
				select: fields
			})
			.then(data => {
				this.success(res, {
					items: data.docs,
					pageCount: data.pages,
					itemCount: data.total,
					currentPage: data.page
				});
				return next();
			})
			.catch(function(err) {
				this.fail(res, err);
				return next();
			});
	}

	addItem(req, res, next) {
		const item = new this.model.ToDoItem({
			text: ToDoListRouter.filter(req.params.text),
			uuid: ToDoListRouter.filter(req.params.uuid) || uuid.v4(),
			dateDelta: parseInt(req.params.dateDelta, 10) || undefined
			// author: 'ido_q'
		});

		item.save((err, item) => {
			if (err) {
				this.fail(res, err);
				return next();
			} else {
				this.success(res, { item });
				return next();
			}
		});
	}

	updateItem(req, res, next) {
		const id = Database.ObjectId(req.params.id);
		const { status } = req.params;

		if (!id) {
			this.fail(res, { message: 'Not found' });
			return next();
		}

		this.model.ToDoItem
			.findOneAndUpdate({ _id: id }, { status })
			.then(() => {
				this.success(res);
				return next();
			})
			.catch(e => {
				this.fail(res, e);
				return next();
			});
	}
}
