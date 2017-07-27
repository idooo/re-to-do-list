interface IConfig {
	server?: {
		host?: string,
		port?: number
	},
	debug?: Object,
	logs?: {
		level?: string,
		isJson?: boolean,
		file?: string
	},
	database: IDatabaseConfig
}

interface IDatabaseConfig {
	uri: string,
	port: number,
	db: string,
	username: string,
	password?: string,
	autoConnect: boolean
}

interface IFormatterOptions {
	level: any,
	message: string,
	meta: {
		stack?: Object
	}
}

declare enum ROLES {
	ADMIN = 10,
	USER = 2
}
