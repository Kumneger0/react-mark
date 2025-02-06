#!/usr/bin/env node
import { createServer } from './server/dev.js';
import { buildFiles } from './utils/buildforprd.js';
const args = process.argv.slice(2);
const arg = args[0];



if (arg == 'dev') {
	console.log(`Command: ${arg}`);
	createServer();
} else if (arg == 'build') {
	buildFiles();
} else {
	console.log('Unknown command. Available commands: dev');
	process.exit(1);
}
