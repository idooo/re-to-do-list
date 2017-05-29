#!/usr/bin/env node

const path = require('path');
const Application = require('./src/app');
const argv = require('yargs')
	.usage('Usage: $0 --config=<config-path>')
	.default('config', `${__dirname}/config/default.json`)
	.describe('config', 'Configuration file to load')
	.help('h')
	.alias('h', 'help')
	.alias('c', 'config')
	.example('$0 --config=/opt/production.json', 'Launches server with specified configuration')
	.epilog('Made with love by Alex')
	.argv;

const app = new Application(path.normalize(argv.config.replace('./', __dirname + '/')));

app.start();
