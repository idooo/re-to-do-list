import { Server, Request, Response, Next } from 'restify';
import { AbstractRouter } from './abstract.router';
import * as logger from 'winston';

export class UserRouter extends AbstractRouter {
	constructor(server: Server) {
		super();

		server.get('/api/1.0/users', this.getUsersList.bind(this));
		server.post('/api/1.0/user', this.createUser.bind(this));
	}

	createUser(req: Request, res: Response, next: Next) {
		const user = new this.model.User({
			name: UserRouter.filter(req.params.name),
			role: parseInt(req.params.role, 10) || ROLES.USER
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
	}

	getUsersList(req: Request, res: Response, next: Next) {
		let page = parseInt(req.params.p, 10) || 1;
		let query = req.params.query || {};
		let sort = req.params.sort || { _id: -1 }; // sort by date, latest first by default
		let fields = '-__v -votes';

		console.log(this.model);
		this.model.User
			.paginate(query, {
				page: page,
				sort: sort,
				limit: 20,
				select: fields
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
