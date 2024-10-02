"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const createServer = require('./lib/cors-anywhere.js').createServer;
// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 8080;
// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
function parseEnvList(env) {
    if (!env) {
        return [];
    }
    if (env.indexOf(',') === -1) {
        return [env];
    }
    return env.split(',');
}
const originBlacklist = parseEnvList((_a = process.env.CORSANYWHERE_BLACKLIST) !== null && _a !== void 0 ? _a : '');
const originWhitelist = parseEnvList((_b = process.env.CORSANYWHERE_WHITELIST) !== null && _b !== void 0 ? _b : '');
// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
const checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);
createServer({
    originBlacklist: originBlacklist,
    originWhitelist: originWhitelist,
    // Comment out or remove the requireHeader option to allow requests without these headers
    // requireHeader: ['origin', 'x-requested-with'],
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
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});
//# sourceMappingURL=index.js.map