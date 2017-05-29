#!/usr/bin/env node

const path = require('path');
const Application = require('./src/app');
const argv = require('yargs')
	.usage('Usage: $0 --config=<config-path>\nUsage standalone: $0 --dir=<directory> --test=<test-name>')
	.default('config', `${__dirname}/config/default.json`)
	.describe('config', 'Configuration file to load')
	.describe('dir', 'Directory with tests for standalone mode')
	.help('h')
	.alias('h', 'help')
	.example('$0 --config=/opt/production.json', 'Launches server with specified configuration')
	.epilog('Made with love by Alex')
	.argv;

const app = new Application(path.normalize(argv.config.replace('./', __dirname + '/')));

app.start();
