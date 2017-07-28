import { Server } from 'restify';
import { AbstractRouter } from './abstract.router';
import { IServer } from '../types/core';
import { ROLE } from '../models/user.model';

const IS_LENGTH_VALIDATION = {
	isLength: {
		options: [{ min: 1, max: 100 }],
		errorMessage: 'Must be between 1 and 1024 chars long'
	}
};

export class UserRouter extends AbstractRouter {
	constructor(server: Server) {
		super();

		server.get('/api/1.0/users', this.getUsers.bind(this));
		server.post('/api/1.0/user', this.createUser.bind(this));
	}

	createUser(req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		const schema = {
			name: {
				...IS_LENGTH_VALIDATION,
				errorMessage: 'Name must be defined'
			}
		};

		req.sanitizeParams('name').escape();
		req.sanitizeParams('name').trim();
		req.check(schema);

		this.validate(req)
			.then(() => {
				const user = new this.model.User({
					name: req.params.name,
					role: ROLE.USER
				});

				user.save((err, createdUser) => {
					if (err) {
						this.fail(res, err);
						return next();
					} else {
						this.success(res, createdUser);
						return next();
					}
				});
			})
			.catch(e => {
				this.fail(res, e);
				return next();
			});
	}

	getUsers(req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		req.check({
			page: {
				isInt: true,
				optional: true
			}
		});

		this.validate(req)
			.then(() => {
				return this.model.User.paginate(
					{},
					{
						page: req.params.page || 1,
						sort: { _id: -1 },
						limit: 20,
						select: '-password'
					}
				);
			})
			.then(data => {
				this.success(res, {
					users: data.docs,
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
}
