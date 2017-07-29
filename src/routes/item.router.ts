import { Server } from 'restify';
import * as uuid from 'uuid';
import * as moment from 'moment';
import { IServer } from '../types/core';
import { AbstractRouter } from './abstract.router';
import { TODO_DATE_CODE_FORMAT, TODO_STATUS_TYPES } from '../models/todo.model';

const IS_LENGTH_VALIDATION = {
	isLength: {
		options: [{ min: 1, max: 1024 }],
		errorMessage: 'Must be between 1 and 1024 chars long'
	}
};

const ACCEPTABLE_STATUSES = Object.keys(TODO_STATUS_TYPES).map(
	i => TODO_STATUS_TYPES[i]
);
const IS_TODO_STATUS_VALIDATION = {
	isIn: {
		options: [ACCEPTABLE_STATUSES],
		errorMessage: `Invalid status: must be one of ${ACCEPTABLE_STATUSES.join(
			', '
		)}`
	}
};

export function toDateCodeSanitiser (value) {
	const toDateCode = moment(value, TODO_DATE_CODE_FORMAT).format(TODO_DATE_CODE_FORMAT);
	if (toDateCode === 'Invalid date') return moment().format(TODO_DATE_CODE_FORMAT);
	return toDateCode;
}

export class ToDoItemRouter extends AbstractRouter {
	constructor(server: Server) {
		super();
		server.get('/api/1.0/items', this.getItems.bind(this));
		server.post('/api/1.0/item', this.addItem.bind(this));
		server.put('/api/1.0/item/:id', this.updateItem.bind(this));
	}

	getItems(req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		req.check({
			page: {
				isInt: true,
				optional: true
			}
		});

		//@todo: get data only for the user
		this.validate(req)
			.then(() => {
				return this.model.ToDoItem.paginate({}, {
					page: req.params.page || 1,
					sort: { _id: -1 },
					limit: 50
				})
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
			.catch(e => {
				this.fail(res, e);
				return next();
			});
	}

	addItem(req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		const schema = {
			text: {
				...IS_LENGTH_VALIDATION,
				errorMessage: 'Text must be defined'
			},
			uuid: {
				optional: true,
				isUUID: {
					options: [4],
					errorMessage: 'Invalid UUID'
				}
			}
		};

		req.sanitizeParams('text').escape();
		req.sanitizeParams('text').trim();
		req.sanitizeParams('dateCode').toDateCode();
		req.check(schema);

		this.validate(req)
			.then(() => {
				const item = new this.model.ToDoItem({
					text: req.params.text,
					uuid: req.params.uuid || uuid.v4(),
					dateCode: req.params.dateCode
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
			})
			.catch(e => {
				this.fail(res, e);
				return next();
			});
	}

	updateItem(req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		const schema = {
			id: {
				notEmpty: true,
				isMongoId: true,
				errorMessage: 'Invalid id'
			},
			status: {
				optional: true,
				...IS_TODO_STATUS_VALIDATION
			},
			text: {
				optional: true,
				...IS_LENGTH_VALIDATION
			}
		};

		req.sanitizeParams('id').toObjectId();
		req.sanitizeParams('text').trim();
		req.sanitizeParams('text').escape();
		req.check(schema);

		return this.validate(req)
			.then(() => {
				const update = {};
				if (req.params.status) update['status'] = req.params.status;
				if (req.params.text) update['text'] = req.params.text;
				return this.model.ToDoItem.findOneAndUpdate(
					{ _id: req.params.id },
					update
				);
			})
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
