import { AbstractRouter } from "./abstract.router";
import * as jwt from 'jsonwebtoken';
import * as passport from 'passport-restify';
import { Server } from "restify";
import { IConfig, IServer } from "../types/core";


export class AuthRouter extends AbstractRouter {

	constructor(server: Server, private config: IConfig) {
		super();

		server.get('/login', passport.authenticate('auth0', {
				clientID: config.auth.providers.auth0.clientID,
				domain: config.auth.providers.auth0.domain,
				redirectUri: config.auth.providers.auth0.callbackURL,
				audience: `https://${config.auth.providers.auth0.domain}/userinfo`,
				responseType: 'code',
				scope: 'openid email'
			}),
			this.loginFailure.bind(this)
		);

		// Perform the final stage of authentication and redirect to '/user'
		server.get('/callback', passport.authenticate('auth0', {
				failureRedirect: '/',
				session: false
			}),
			this.callback.bind(this)
		);
	}

	loginFailure (req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		res.redirect('/', next);
	};

	callback (req: IServer.Request, res: IServer.Response, next: IServer.Next) {
		const token = jwt.sign(
			{ _id: req.user._id, role: req.user.role },
			this.config.auth.jwtSecret,
			{ expiresIn: '7d' }
		);
		res.redirect(`${this.config.auth.successRedirectURL}/#/token=${token}`, next);
	}
}
