import { Server } from 'restify';
import * as uuid from 'uuid';
import * as moment from 'moment';
import { IServer } from '../types/core';
import { AbstractRouter } from './abstract.router';
import { TODO_DATE_CODE_FORMAT, TODO_STATUS_TYPES } from '../models/todo.model';
import { NotFoundError } from '../errors';

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
const IS_PAGE_VALIDATION = {
	isInt: true,
	optional: true
};
const IS_PRIORITY_VALIDATION = {
	isInt: true,
	optional: true
};
const IS_ID_VALIDATION = {
	notEmpty: true,
	isMongoId: true,
	errorMessage: 'Invalid id'
};

export function toDateCodeSanitiser (value) {
	const toDateCode = moment(value, TODO_DATE_CODE_FORMAT).format(TODO_DATE_CODE_FORMAT);
	if (toDateCode === 'Invalid date') return moment().format(TODO_DATE_CODE_FORMAT);
	return toDateCode;
}

export class ToDoItemRouter extends AbstractRouter {
	constructor(server: Server) {
		super();

		server.get('/api/1.0/lists', this.getLists.bind(this));
		server.get('/api/1.0/list/:listId', this.getItems.bind(this));
		server.post('/api/1.0/list/:listId/item', this.addItem.bind(this));
		server.put('/api/1.0/list/:listId/item/:itemId', this.updateItem.bind(this));
	}

	getLists (req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		req.check({
			page: {...IS_PAGE_VALIDATION}
		});

		this.validate(req)
			.then(() => {
				return this.model.ToDoList.paginate({user: req.user._id}, {
					page: req.params.page || 1,
					sort: { _id : -1 },
					limit: 50
				})
			})
			.then(data => {
				this.success(res, data);
				return next();
			})
			.catch(e => {
				this.fail(res, e);
				return next();
			});
	}

	getItems(req: IServer.Request, res: IServer.Response, next: IServer.Next) {

		req.sanitizeParams('listId').toObjectId();
		req.check({
			page: {...IS_PAGE_VALIDATION},
			listId: {...IS_ID_VALIDATION}
		});

		this.validate(req)
			.then(() => {
				return this.model.ToDoList.findOne({
					_id: req.params.listId,
					user: req.user._id
				})
			})
			.then(list => {
				if (!list) throw new NotFoundError(`List ${req.params.listId} not found`);

				return Promise.all([
					list,
					this.model.ToDoItem.paginate({
						list: list._id,
						// get only records for the last month
						dateCode: { $gte: moment().subtract(1, 'month').format(TODO_DATE_CODE_FORMAT) }
					}, {
						page: req.params.page || 1,
						sort: { priority: -1 },
						limit: 100
					})
				]);
			})
			.then(data => {
				this.success(res, {
					list: data[0],
					...data[1]
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
			listId: {
				...IS_ID_VALIDATION
			},
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
			},
			priority: {
				...IS_PRIORITY_VALIDATION
			}
		};

		req.sanitizeParams('listId').toObjectId();
		req.sanitizeParams('text').escape();
		req.sanitizeParams('text').trim();
		req.sanitizeParams('dateCode').toDateCode();
		req.check(schema);

		this.validate(req)
			.then(() => {
				return this.model.ToDoList.findOne({
					_id: req.params.listId,
					user: req.user._id
				})
			})
			.then(list => {
				if (!list) throw new NotFoundError(`List ${req.params.listId} not found`);
				const item = new this.model.ToDoItem({
					text: req.params.text,
					list: list._id,
					uuid: req.params.uuid || uuid.v4(),
					priority: req.params.priority || 0,
					dateCode: req.params.dateCode
				});
				return item.save();
			})
			.then(item => {
				this.success(res, { item });
				return next();
			})
			.catch(e => {
				this.fail(res, e);
				return next();
			});
	}

	updateItem(req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		const schema = {
			itemId: {
				...IS_ID_VALIDATION
			},
			listId: {
				...IS_ID_VALIDATION
			},
			status: {
				optional: true,
				...IS_TODO_STATUS_VALIDATION
			},
			text: {
				optional: true,
				...IS_LENGTH_VALIDATION
			},
			priority: {
				...IS_PRIORITY_VALIDATION
			}
		};

		req.sanitizeParams('itemId').toObjectId();
		req.sanitizeParams('listId').toObjectId();
		req.sanitizeParams('text').trim();
		req.sanitizeParams('text').escape();
		req.check(schema);

		const update = {};

		this.validate(req)
			.then(() => {
				return this.model.ToDoList.findOne({
					_id: req.params.listId,
					user: req.user._id
				})
			})
			.then(list => {
				if (!list) throw new NotFoundError(`List ${req.params.listId} not found`);
				if (req.params.status) update['status'] = req.params.status;
				if (req.params.text) update['text'] = req.params.text;
				if (!isNaN(req.params.priority)) update['priority'] = req.params.priority;
				return this.model.ToDoItem.findOneAndUpdate(
					{ _id: req.params.itemId },
					update
				);
			})
			.then(item => {
				if (!item) throw new NotFoundError(`Item ${req.params.itemId} not found`);
				this.success(res, { item: {...item._doc, ...update} });
				return next();
			})
			.catch(e => {
				this.fail(res, e);
				return next();
			});
	}
}
