import * as passport from 'passport-restify';
import * as Auth0Strategy from 'passport-auth0';
import * as logger from 'winston';
import * as jwt from 'express-jwt';
import { Database } from "./database";
import { ROLE } from "./models/user.model";
import { Server } from "restify";
import { IConfig } from "./types/core";


export class Authentication {

	// @todo error handling
	constructor (server: Server, config: IConfig) {
		// Configure Passport to use Auth0
		const strategy = new Auth0Strategy(
			config.auth.providers.auth0,
			(accessToken, refreshToken, extraParams, profile, done) => {
				try {
					// @todo what if multiple emails
					(<any>Database.model.User).findOne({email: profile.emails[0].value})
						.then(user => {
							if (!user) {
								const newUser = new (<any>Database.model.User)({
									email: profile.emails[0].value,
									role: ROLE.USER
								});

								return newUser.save();
							}
							return user;
						})
						.then(user => {
							done(null, user);
						})
				}
				catch (e) {
					logger.warn(e);
				}
			}
		);

		passport.use(strategy);
		server.use(passport.initialize());

		server.use(jwt({secret: config.auth.jwtSecret}).unless({path: [
			/^(?!\/api\/).*/,
			{ method: 'OPTIONS' }
		]}));
	}
}
