'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
require('dotenv').config();
const fs = require('fs');
const createServer = require('./lib/cors-anywhere').createServer;
// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 8080;
const sslCert = process.env.SSL_CERT || null;
const sslKey = process.env.SSL_KEY || null;
function parseEnvList(env) {
	return env
		.split(',')
		.map(value => value.trim())
		.filter(Boolean);
}
function requireEnvList(name, values) {
	if (!values.length) {
		throw new Error(
			`${name} must contain at least one comma-separated value.`,
		);
	}
}
const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST ?? '');
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST ?? '');
const destinationWhitelist = parseEnvList(
	process.env.CORSANYWHERE_DESTINATION_WHITELIST ?? '',
);
requireEnvList('CORSANYWHERE_WHITELIST', originWhitelist);
requireEnvList('CORSANYWHERE_DESTINATION_WHITELIST', destinationWhitelist);
// Rate limiting is defense-in-depth; allowlists are the request-forgery boundary.
const checkRateLimit = require('./lib/rate-limit')(
	process.env.CORSANYWHERE_RATELIMIT,
);
let httpsOptions = null;
if (sslCert && sslKey && fs.existsSync(sslCert) && fs.existsSync(sslKey)) {
	httpsOptions = {
		cert: fs.readFileSync(sslCert),
		key: fs.readFileSync(sslKey),
	};
}
createServer({
	httpsOptions: httpsOptions,
	originBlacklist: originBlacklist,
	originWhitelist: originWhitelist,
	destinationWhitelist: destinationWhitelist,
	requireHeader: 'origin',
	checkRateLimit: checkRateLimit,
	removeHeaders: [
		'cookie',
		'cookie2',
		// Strip Heroku-specific headers
		'x-request-start',
		'x-request-id',
		'via',
		'connect-time',
		'total-route-time',
		// Other Heroku added debug headers
		// 'x-forwarded-for',
		// 'x-forwarded-proto',
		// 'x-forwarded-port',
	],
	redirectSameOrigin: true,
	httpProxyOptions: {
		// Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
		xfwd: false,
	},
	// Add the handleInitialRequest option to log requests
	handleInitialRequest: (_req, _res, _location) => {
		// console.log(`Request made from: ${req.headers.origin || 'unknown origin'} to: ${location}`);
		// Continue with the request
		return false;
	},
}).listen(port, host, function () {
	const hostName = httpsOptions ? `https://${host}` : `http://${host}`;
	console.log(`Running CORS Anywhere on: ${hostName}:${port}`);
});
//# sourceMappingURL=index.js.map
