import * as passport from 'passport-restify';
import * as Auth0Strategy from 'passport-auth0';
import * as logger from 'winston';
import * as jwt from 'express-jwt';

import { Database } from "./database";
import { ROLE } from "./models/user.model";
import { Server } from "restify";
import { IConfig } from "./types/core";
import { UserCreationError } from "./errors";


export class Authentication {

	// @todo error handling
	constructor (server: Server, config: IConfig) {
		// Configure Passport to use Auth0
		const strategy = new Auth0Strategy(
			config.auth.providers.auth0,
			(accessToken, refreshToken, extraParams, profile, done) => {
				try {
					// @todo what if multiple emails
					this.getOrCreateUser(profile.emails[0].value)
						.then(user => {
							logger.debug(`User has been authorised: ${user.email}`);
							done(null, user);
						})
						.catch(err => {
							throw new UserCreationError(err);
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
			{ method: 'OPTIONS' },
			'/api/1.0/login',
			'/api/1.0/callback'
		]}));
	}

	getOrCreateUser (email: string): Promise<any> {
		return new Promise((resolve, reject) => {
			(<any>Database.model.User).findOne({email})
				.then(user => {
					if (user) return resolve(user);

					const newUser = new (<any>Database.model.User)({
						email: email,
						role: ROLE.USER
					});
					return newUser.save();
				})
				.then(user => {
					logger.info(`New user created: ${user.email}`);
					const list = new (<any>Database.model.ToDoList)({
						user: user._id,
						name: 'My First ToDo List'
					});
					list.save();
					resolve(user);
				})
				.catch(err => reject(err));
		})

	}
}
