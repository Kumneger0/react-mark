#!/usr/bin/env node
import { createServer } from './server/dev.js';
const args = process.argv.slice(2);

if (args[0] === 'dev') {
	createServer();
} else {
	console.log('Unknown command. Available commands: dev');
	process.exit(1);
}
