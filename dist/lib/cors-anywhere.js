'use strict';
// © 2013 - 2016 Rob Wu <rob@robwu.nl>
// Released under the MIT license
const httpProxy = require('http-proxy');
const dns = require('dns');
const http = require('http');
const https = require('https');
const net = require('net');
const url = require('url');
const regexp_tld = require('./regexp-top-level-domain');
const getProxyForUrl = require('proxy-from-env').getProxyForUrl;
const DEBUG_MODE = process.env.DEBUG;
const help_text = {};
const DEFAULT_PORTS = {
	'http:': '80',
	'https:': '443',
};
const BLOCKED_IPV4_RANGES = [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.0.2.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['198.51.100.0', 24],
	['203.0.113.0', 24],
	['224.0.0.0', 4],
	['240.0.0.0', 4],
].map(function (range) {
	return {
		base: ipv4ToNumber(range[0]),
		bits: range[1],
	};
});
const BLOCKED_IPV6_PREFIXES = [
	['64:ff9b::', 96],
	['64:ff9b:1::', 48],
	['5f00::', 16],
	['100::', 64],
	['2001::', 23],
	['2001:2::', 48],
	['2001:db8::', 32],
	['2002::', 16],
	['fec0::', 10],
].map(function (range) {
	return {
		bytes: ipv6ToBytes(range[0]),
		bits: range[1],
	};
});
function showUsage(help_file, headers, response) {
	const isHtml = /\.html$/.test(help_file);
	headers['content-type'] = isHtml ? 'text/html' : 'text/plain';
	if (help_text[help_file] != null) {
		response.writeHead(200, headers);
		response.end(help_text[help_file]);
	} else {
		require('fs').readFile(help_file, 'utf8', function (err, data) {
			if (err) {
				if (DEBUG_MODE) {
					console.error(err);
				}
				response.writeHead(500, headers);
				response.end();
			} else {
				help_text[help_file] = data;
				// Recursive call, but since data is a string, the recursion will end
				showUsage(help_file, headers, response);
			}
		});
	}
}
/**
 * Check whether the specified hostname is valid.
 *
 * @param hostname {string} Host name (excluding port) of requested resource.
 * @return {boolean} Whether the requested resource can be accessed.
 */
function isValidHostName(hostname) {
	return !!(
		regexp_tld.test(hostname) ||
		net.isIPv4(hostname) ||
		net.isIPv6(hostname)
	);
}
function normalizeHostName(hostname) {
	const value = String(hostname || '').toLowerCase();
	return value.charAt(0) === '[' && value.charAt(value.length - 1) === ']'
		? value.slice(1, -1)
		: value;
}
function getEffectivePort(location) {
	return location.port || DEFAULT_PORTS[location.protocol] || '';
}
function parsePort(port, description) {
	if (!/^\d+$/.test(port)) {
		throw new Error(
			'Invalid destination whitelist port in "' + description + '".',
		);
	}
	const portNumber = Number(port);
	if (portNumber < 1 || portNumber > 65535) {
		throw new Error(
			'Destination whitelist port out of range in "' + description + '".',
		);
	}
	return String(portNumber);
}
function getExplicitPortFromAuthority(authority, description) {
	if (authority.charAt(0) === '[') {
		const closeBracketIndex = authority.indexOf(']');
		if (closeBracketIndex === -1) {
			throw new Error(
				'Invalid IPv6 destination whitelist entry "' +
					description +
					'".',
			);
		}
		const remainder = authority.slice(closeBracketIndex + 1);
		if (!remainder) {
			return null;
		}
		if (remainder.charAt(0) !== ':') {
			throw new Error(
				'Invalid destination whitelist entry "' + description + '".',
			);
		}
		return remainder.slice(1);
	}
	const colonIndex = authority.lastIndexOf(':');
	if (colonIndex === -1) {
		return null;
	}
	if (authority.indexOf(':') !== colonIndex) {
		throw new Error(
			'IPv6 destination whitelist entries must use brackets in "' +
				description +
				'".',
		);
	}
	return authority.slice(colonIndex + 1);
}
function normalizeDestinationWhitelistEntry(entry) {
	const value = String(entry || '').trim();
	if (!value) {
		throw new Error('Destination whitelist entries must not be empty.');
	}
	const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
	const parsed = new URL(hasProtocol ? value : 'http://' + value);
	if (
		parsed.username ||
		parsed.password ||
		parsed.pathname !== '/' ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(
			'Destination whitelist entries must only include scheme, host, and optional port: "' +
				value +
				'".',
		);
	}
	if (hasProtocol && !DEFAULT_PORTS[parsed.protocol]) {
		throw new Error(
			'Destination whitelist entries only support http and https: "' +
				value +
				'".',
		);
	}
	const explicitPort = hasProtocol
		? parsed.port || null
		: getExplicitPortFromAuthority(value, value);
	const port =
		explicitPort !== null
			? parsePort(explicitPort, value)
			: hasProtocol
				? DEFAULT_PORTS[parsed.protocol]
				: null;
	return {
		protocol: hasProtocol ? parsed.protocol : null,
		hostname: normalizeHostName(parsed.hostname),
		port: port,
	};
}
function normalizeDestinationWhitelist(destinationWhitelist) {
	if (destinationWhitelist == null) {
		return null;
	}
	const entries =
		typeof destinationWhitelist === 'string'
			? [destinationWhitelist]
			: destinationWhitelist;
	if (!Array.isArray(entries)) {
		throw new Error(
			'destinationWhitelist must be a string, an array of strings, or null.',
		);
	}
	return entries.map(normalizeDestinationWhitelistEntry);
}
function isDestinationAllowed(destinationWhitelist, location) {
	if (destinationWhitelist == null) {
		return true;
	}
	const hostname = normalizeHostName(location.hostname);
	const port = getEffectivePort(location);
	return destinationWhitelist.some(function (entry) {
		if (entry.hostname !== hostname) {
			return false;
		}
		if (entry.protocol && entry.protocol !== location.protocol) {
			return false;
		}
		if (entry.port) {
			return entry.port === port;
		}
		return port === DEFAULT_PORTS[location.protocol];
	});
}
function resolveNoSchemeHttpsDestination(
	destinationWhitelist,
	location,
	reqUrl,
) {
	if (
		destinationWhitelist == null ||
		/^\/https?:\/\//i.test(reqUrl) ||
		location.protocol !== 'http:' ||
		location.port ||
		isDestinationAllowed(destinationWhitelist, location)
	) {
		return location;
	}
	const httpsLocation = parseURL(
		'https://' + location.host + (location.path || ''),
	);
	return httpsLocation &&
		isDestinationAllowed(destinationWhitelist, httpsLocation)
		? httpsLocation
		: location;
}
function ipv4ToBytes(address) {
	if (!net.isIPv4(address)) {
		return null;
	}
	return address.split('.').map(function (part) {
		return Number(part);
	});
}
function ipv4ToNumber(address) {
	const bytes = ipv4ToBytes(address);
	if (!bytes) {
		return 0;
	}
	return (
		(((bytes[0] * 256 + bytes[1]) * 256 + bytes[2]) * 256 + bytes[3]) >>> 0
	);
}
function isIpv4InRange(address, base, bits) {
	const value = ipv4ToNumber(address);
	const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
	return (value & mask) === (base & mask);
}
function isUnsafeIPv4(address) {
	return BLOCKED_IPV4_RANGES.some(function (range) {
		return isIpv4InRange(address, range.base, range.bits);
	});
}
function ipv6ToBytes(address) {
	let input = normalizeHostName(address);
	const zoneIndex = input.indexOf('%');
	if (zoneIndex !== -1) {
		input = input.slice(0, zoneIndex);
	}
	if (input.indexOf('.') !== -1) {
		const lastColonIndex = input.lastIndexOf(':');
		if (lastColonIndex === -1) {
			return null;
		}
		const ipv4Bytes = ipv4ToBytes(input.slice(lastColonIndex + 1));
		if (!ipv4Bytes) {
			return null;
		}
		input =
			input.slice(0, lastColonIndex) +
			':' +
			((ipv4Bytes[0] << 8) | ipv4Bytes[1]).toString(16) +
			':' +
			((ipv4Bytes[2] << 8) | ipv4Bytes[3]).toString(16);
	}
	const compressedParts = input.split('::');
	if (compressedParts.length > 2) {
		return null;
	}
	let parts;
	if (compressedParts.length === 2) {
		const head = compressedParts[0] ? compressedParts[0].split(':') : [];
		const tail = compressedParts[1] ? compressedParts[1].split(':') : [];
		const missingParts = 8 - head.length - tail.length;
		if (missingParts < 1) {
			return null;
		}
		parts = head.concat(new Array(missingParts).fill('0'), tail);
	} else {
		parts = input.split(':');
		if (parts.length !== 8) {
			return null;
		}
	}
	if (parts.length !== 8) {
		return null;
	}
	const bytes = [];
	for (let i = 0; i < parts.length; i += 1) {
		if (!/^[0-9a-f]{1,4}$/.test(parts[i])) {
			return null;
		}
		const value = parseInt(parts[i], 16);
		bytes.push(value >> 8, value & 0xff);
	}
	return bytes;
}
function isAllZero(bytes, start, end) {
	for (let i = start; i < end; i += 1) {
		if (bytes[i] !== 0) {
			return false;
		}
	}
	return true;
}
function matchesIPv6Prefix(bytes, prefixBytes, bits) {
	const fullBytes = Math.floor(bits / 8);
	const remainingBits = bits % 8;
	for (let i = 0; i < fullBytes; i += 1) {
		if (bytes[i] !== prefixBytes[i]) {
			return false;
		}
	}
	if (!remainingBits) {
		return true;
	}
	const mask = (0xff << (8 - remainingBits)) & 0xff;
	return (bytes[fullBytes] & mask) === (prefixBytes[fullBytes] & mask);
}
function isIPv4MappedIPv6(bytes) {
	return isAllZero(bytes, 0, 10) && bytes[10] === 0xff && bytes[11] === 0xff;
}
function isUnsafeIPv6(address) {
	const bytes = ipv6ToBytes(address);
	if (!bytes) {
		return true;
	}
	if (isAllZero(bytes, 0, 16)) {
		return true;
	}
	if (isAllZero(bytes, 0, 15) && bytes[15] === 1) {
		return true;
	}
	if (isIPv4MappedIPv6(bytes)) {
		return isUnsafeIPv4(bytes.slice(12).join('.'));
	}
	if (isAllZero(bytes, 0, 12)) {
		return true;
	}
	if ((bytes[0] & 0xfe) === 0xfc) {
		return true;
	}
	if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) {
		return true;
	}
	if (bytes[0] === 0xff) {
		return true;
	}
	return BLOCKED_IPV6_PREFIXES.some(function (range) {
		return matchesIPv6Prefix(bytes, range.bytes, range.bits);
	});
}
function isUnsafeIPAddress(address) {
	if (net.isIPv4(address)) {
		return isUnsafeIPv4(address);
	}
	if (net.isIPv6(address)) {
		return isUnsafeIPv6(address);
	}
	return false;
}
function normalizeLookupAddresses(addresses, family) {
	if (Array.isArray(addresses)) {
		return addresses.map(function (entry) {
			return {
				address: entry.address,
				family: entry.family,
			};
		});
	}
	if (typeof addresses === 'string') {
		return [
			{
				address: addresses,
				family: family,
			},
		];
	}
	return [];
}
function createDestinationError(message) {
	const error = new Error(message);
	error.statusCode = 403;
	error.statusMessage = 'Forbidden';
	return error;
}
function selectLookupAddress(addresses, options) {
	const family = options && options.family ? Number(options.family) : 0;
	return (
		addresses.find(function (entry) {
			return !family || Number(entry.family) === family;
		}) || addresses[0]
	);
}
function createPinnedLookup(hostname, addresses, fallbackLookup) {
	const normalizedHostname = normalizeHostName(hostname);
	return function pinnedLookup(requestedHostname, options, callback) {
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		if (normalizeHostName(requestedHostname) !== normalizedHostname) {
			return fallbackLookup(requestedHostname, options, callback);
		}
		if (options && options.all) {
			return callback(null, addresses.slice());
		}
		const selectedAddress = selectLookupAddress(addresses, options);
		return callback(null, selectedAddress.address, selectedAddress.family);
	};
}
function validateDestination(requestState, location, callback) {
	if (requestState.destinationWhitelist == null) {
		callback(null);
		return;
	}
	if (!DEFAULT_PORTS[location.protocol]) {
		callback(
			createDestinationError('Destination protocol is not allowed.'),
		);
		return;
	}
	if (!isDestinationAllowed(requestState.destinationWhitelist, location)) {
		callback(
			createDestinationError('Destination is not allowed by this proxy.'),
		);
		return;
	}
	const hostname = normalizeHostName(location.hostname);
	if (net.isIP(hostname)) {
		if (isUnsafeIPAddress(hostname)) {
			callback(
				createDestinationError(
					'Destination address is not allowed by this proxy.',
				),
			);
			return;
		}
		callback(null);
		return;
	}
	requestState.destinationLookup(
		hostname,
		{ all: true },
		function (err, addresses, family) {
			if (err) {
				callback(
					createDestinationError(
						'Destination could not be resolved by this proxy.',
					),
				);
				return;
			}
			const lookupAddresses = normalizeLookupAddresses(addresses, family);
			if (!lookupAddresses.length) {
				callback(
					createDestinationError(
						'Destination could not be resolved by this proxy.',
					),
				);
				return;
			}
			const unsafeAddress = lookupAddresses.find(function (entry) {
				return isUnsafeIPAddress(entry.address);
			});
			if (unsafeAddress) {
				callback(
					createDestinationError(
						'Destination address is not allowed by this proxy.',
					),
				);
				return;
			}
			requestState.validatedLookup = createPinnedLookup(
				hostname,
				lookupAddresses,
				requestState.destinationLookup,
			);
			callback(null);
		},
	);
}
function rejectRequest(req, res, err) {
	if (res.headersSent) {
		res.end();
		return;
	}
	res.writeHead(
		err.statusCode || 403,
		err.statusMessage || 'Forbidden',
		withCORS({}, req),
	);
	res.end(err.message);
}
function isOriginAllowed(corsAnywhere, origin) {
	if (corsAnywhere.originBlacklist.indexOf(origin) >= 0) {
		return false;
	}
	if (
		corsAnywhere.originWhitelist.length &&
		corsAnywhere.originWhitelist.indexOf(origin) === -1
	) {
		return false;
	}
	return true;
}
function appendVary(headers, value) {
	const currentValue = headers.vary || headers.Vary;
	if (!currentValue) {
		headers.vary = value;
		return;
	}
	const existingValues = currentValue.split(',').map(function (part) {
		return part.trim().toLowerCase();
	});
	if (existingValues.indexOf(value.toLowerCase()) === -1) {
		headers.vary = currentValue + ', ' + value;
	}
}
/**
 * Adds CORS headers to the response headers.
 *
 * @param headers {object} Response headers
 * @param request {ServerRequest}
 */
function withCORS(headers, request) {
	const requestState = request.corsAnywhereRequestState || {
		originWhitelist: [],
		corsMaxAge: 0,
	};
	const origin = request.headers.origin || '';
	if (requestState.originWhitelist.length) {
		if (requestState.originWhitelist.indexOf(origin) === -1 || !origin) {
			return headers;
		}
		headers['access-control-allow-origin'] = origin;
		appendVary(headers, 'Origin');
	} else {
		headers['access-control-allow-origin'] = '*';
	}
	const corsMaxAge = requestState.corsMaxAge;
	if (request.method === 'OPTIONS' && corsMaxAge) {
		headers['access-control-max-age'] = corsMaxAge;
	}
	if (request.headers['access-control-request-method']) {
		headers['access-control-allow-methods'] =
			request.headers['access-control-request-method'];
		delete request.headers['access-control-request-method'];
	}
	if (request.headers['access-control-request-headers']) {
		headers['access-control-allow-headers'] =
			request.headers['access-control-request-headers'];
		delete request.headers['access-control-request-headers'];
	}
	headers['access-control-expose-headers'] = Object.keys(headers).join(',');
	return headers;
}
function validateAndProxyRequest(req, res, proxy) {
	const requestState = req.corsAnywhereRequestState;
	validateDestination(requestState, requestState.location, function (err) {
		if (err) {
			rejectRequest(req, res, err);
			return;
		}
		proxyRequest(req, res, proxy);
	});
}
/**
 * Performs the actual proxy request.
 *
 * @param req {ServerRequest} Incoming http request
 * @param res {ServerResponse} Outgoing (proxied) http request
 * @param proxy {HttpProxy}
 */
function proxyRequest(req, res, proxy) {
	const requestState = req.corsAnywhereRequestState;
	const location = requestState.location;
	req.url = location.path;
	const proxyOptions = {
		changeOrigin: false,
		prependPath: false,
		target: location,
		headers: {
			host: location.host,
		},
		// HACK: Get hold of the proxyReq object, because we need it later.
		// https://github.com/nodejitsu/node-http-proxy/blob/v1.11.1/lib/http-proxy/passes/web-incoming.js#L144
		buffer: {
			pipe: function (proxyReq) {
				const proxyReqOn = proxyReq.on;
				// Intercepts the handler that connects proxyRes to res.
				// https://github.com/nodejitsu/node-http-proxy/blob/v1.11.1/lib/http-proxy/passes/web-incoming.js#L146-L158
				proxyReq.on = function (eventName, listener) {
					if (eventName !== 'response') {
						return proxyReqOn.call(this, eventName, listener);
					}
					return proxyReqOn.call(
						this,
						'response',
						function (proxyRes) {
							if (
								onProxyResponse(
									proxy,
									proxyReq,
									proxyRes,
									req,
									res,
								)
							) {
								try {
									listener(proxyRes);
								} catch (err) {
									// Wrap in try-catch because an error could occur:
									// "RangeError: Invalid status code: 0"
									// https://github.com/Rob--W/cors-anywhere/issues/95
									// https://github.com/nodejitsu/node-http-proxy/issues/1080
									// Forward error (will ultimately emit the 'error' event on our proxy object):
									// https://github.com/nodejitsu/node-http-proxy/blob/v1.11.1/lib/http-proxy/passes/web-incoming.js#L134
									proxyReq.emit('error', err);
								}
							}
						},
					);
				};
				return req.pipe(proxyReq);
			},
		},
	};
	const proxyThroughUrl = req.corsAnywhereRequestState.getProxyForUrl(
		location.href,
	);
	if (proxyThroughUrl) {
		if (requestState.destinationWhitelist != null) {
			rejectRequest(
				req,
				res,
				createDestinationError(
					'Outbound proxy routing is not allowed when destination validation is enabled.',
				),
			);
			return;
		}
		proxyOptions.target = proxyThroughUrl;
		proxyOptions.toProxy = true;
		// If a proxy URL was set, req.url must be an absolute URL. Then the request will not be sent
		// directly to the proxied URL, but through another proxy.
		req.url = location.href;
	} else if (requestState.validatedLookup) {
		proxyOptions.agent =
			location.protocol === 'https:'
				? new https.Agent({
						lookup: requestState.validatedLookup,
					})
				: new http.Agent({
						lookup: requestState.validatedLookup,
					});
	}
	// Start proxying the request
	try {
		proxy.web(req, res, proxyOptions);
	} catch (err) {
		proxy.emit('error', err, req, res);
	}
}
/**
 * This method modifies the response headers of the proxied response.
 * If a redirect is detected, the response is not sent to the client,
 * and a new request is initiated.
 *
 * client (req) -> CORS Anywhere -> (proxyReq) -> other server
 * client (res) <- CORS Anywhere <- (proxyRes) <- other server
 *
 * @param proxy {HttpProxy}
 * @param proxyReq {ClientRequest} The outgoing request to the other server.
 * @param proxyRes {ServerResponse} The response from the other server.
 * @param req {IncomingMessage} Incoming HTTP request, augmented with property corsAnywhereRequestState
 * @param req.corsAnywhereRequestState {object}
 * @param req.corsAnywhereRequestState.location {object} See parseURL
 * @param req.corsAnywhereRequestState.getProxyForUrl {function} See proxyRequest
 * @param req.corsAnywhereRequestState.proxyBaseUrl {string} Base URL of the CORS API endpoint
 * @param req.corsAnywhereRequestState.maxRedirects {number} Maximum number of redirects
 * @param req.corsAnywhereRequestState.redirectCount_ {number} Internally used to count redirects
 * @param res {ServerResponse} Outgoing response to the client that wanted to proxy the HTTP request.
 *
 * @returns {boolean} true if http-proxy should continue to pipe proxyRes to res.
 */
function onProxyResponse(proxy, proxyReq, proxyRes, req, res) {
	const requestState = req.corsAnywhereRequestState;
	const statusCode = proxyRes.statusCode;
	if (!requestState.redirectCount_) {
		res.setHeader('x-request-url', requestState.location.href);
	}
	// Handle redirects
	if (
		statusCode === 301 ||
		statusCode === 302 ||
		statusCode === 303 ||
		statusCode === 307 ||
		statusCode === 308
	) {
		let locationHeader = proxyRes.headers.location;
		let parsedLocation;
		if (locationHeader) {
			locationHeader = url.resolve(
				requestState.location.href,
				locationHeader,
			);
			parsedLocation = parseURL(locationHeader);
		}
		if (parsedLocation) {
			if (
				statusCode === 301 ||
				statusCode === 302 ||
				statusCode === 303
			) {
				// Exclude 307 & 308, because they are rare, and require preserving the method + request body
				requestState.redirectCount_ =
					requestState.redirectCount_ + 1 || 1;
				if (requestState.redirectCount_ <= requestState.maxRedirects) {
					// Handle redirects within the server, because some clients (e.g. Android Stock Browser)
					// cancel redirects.
					// Set header for debugging purposes. Do not try to parse it!
					res.setHeader(
						'X-CORS-Redirect-' + requestState.redirectCount_,
						statusCode + ' ' + locationHeader,
					);
					req.method = 'GET';
					req.headers['content-length'] = '0';
					delete req.headers['content-type'];
					requestState.location = parsedLocation;
					requestState.validatedLookup = null;
					// Remove all listeners (=reset events to initial state)
					req.removeAllListeners();
					// Remove the error listener so that the ECONNRESET "error" that
					// may occur after aborting a request does not propagate to res.
					// https://github.com/nodejitsu/node-http-proxy/blob/v1.11.1/lib/http-proxy/passes/web-incoming.js#L134
					proxyReq.removeAllListeners('error');
					proxyReq.once('error', function catchAndIgnoreError() {});
					proxyReq.abort();
					// Initiate a new proxy request.
					validateAndProxyRequest(req, res, proxy);
					return false;
				}
			}
			proxyRes.headers.location =
				requestState.proxyBaseUrl + '/' + locationHeader;
		}
	}
	// Strip cookies
	delete proxyRes.headers['set-cookie'];
	delete proxyRes.headers['set-cookie2'];
	proxyRes.headers['x-final-url'] = requestState.location.href;
	withCORS(proxyRes.headers, req);
	return true;
}
/**
 * @param req_url {string} The requested URL (scheme is optional).
 * @return {object} URL parsed using url.parse
 */
function parseURL(req_url) {
	if (DEBUG_MODE) {
		console.log(`Original request URL: ${req_url}`);
	}
	if (/^https?:\/\/(?:[/?#]|$)/i.test(req_url)) {
		if (DEBUG_MODE) {
			console.log('URL parsing failed: Protocol URL has no hostname.');
		}
		return null;
	}
	if (/^https?:\/(?!\/)/i.test(req_url)) {
		if (DEBUG_MODE) {
			console.log(
				'URL parsing failed: Protocol URL has too few slashes.',
			);
		}
		return null;
	}
	// Regular expression to match URL components
	const regexMatcher =
		/^(?:(https?:)?\/\/)?(([^\/?]+?)(?::(\d{0,5})(?=[\/?]|$))?)([\/?][\S\s]*|$)/i;
	const match = req_url.match(regexMatcher);
	//                              ^^^^^^^          ^^^^^^^^      ^^^^^^^                ^^^^^^^^^^^^
	//                            1:protocol       3:hostname     4:port                 5:path + query string
	//                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	//                                            2:host
	if (!match) {
		if (DEBUG_MODE) {
			console.log('URL parsing failed: No match found.');
		}
		return null;
	}
	let protocol = match[1];
	const host = match[2];
	const path = match[5];
	if (DEBUG_MODE) {
		console.log(
			`Parsed components - Protocol: ${protocol}, Host: ${host}, Path: ${path}`,
		);
	}
	// Handle missing protocol by reconstructing the URL
	if (!protocol) {
		if (match[4] === '443') {
			protocol = 'https:';
		} else {
			protocol = 'http:';
		}
		if (DEBUG_MODE) {
			console.log(
				`Protocol missing. Assuming protocol based on port: ${protocol}`,
			);
		}
	}
	// Ensure URL is reconstructed correctly
	req_url = protocol + '//' + host + (path || '');
	if (DEBUG_MODE) {
		console.log(`Reconstructed URL: ${req_url}`);
	}
	const parsed = url.parse(req_url);
	if (!parsed.hostname) {
		// Handle malformed URLs
		if (DEBUG_MODE) {
			console.log('URL parsing failed: No hostname found.');
		}
		return null;
	}
	if (DEBUG_MODE) {
		console.log(`Final parsed URL object: ${JSON.stringify(parsed)}`);
	}
	if (DEBUG_MODE) {
		console.log(' ');
	}
	return parsed;
}
// Request handler factory
function getHandler(options, proxy) {
	const corsAnywhere = {
		handleInitialRequest: null, // Function that may handle the request instead, by returning a truthy value.
		getProxyForUrl: getProxyForUrl, // Function that specifies the proxy to use
		maxRedirects: 5, // Maximum number of redirects to be followed.
		originBlacklist: [], // Requests from these origins will be blocked.
		originWhitelist: [], // If non-empty, requests not from an origin in this list will be blocked.
		destinationWhitelist: null, // If set, requests to other destinations will be blocked.
		destinationLookup: dns.lookup, // DNS lookup used for destination validation.
		checkRateLimit: null, // Function that may enforce a rate-limit by returning a non-empty string.
		redirectSameOrigin: false, // Redirect the client to the requested URL for same-origin requests.
		requireHeader: null, // Require a header to be set?
		removeHeaders: [], // Strip these request headers.
		setHeaders: {}, // Set these request headers.
		corsMaxAge: 0, // If set, an Access-Control-Max-Age header with this value (in seconds) will be added.
		helpFile: __dirname + '/help.txt',
	};
	Object.keys(corsAnywhere).forEach(function (option) {
		if (Object.prototype.hasOwnProperty.call(options, option)) {
			corsAnywhere[option] = options[option];
		}
	});
	// Convert corsAnywhere.requireHeader to an array of lowercase header names, or null.
	if (corsAnywhere.requireHeader) {
		if (typeof corsAnywhere.requireHeader === 'string') {
			corsAnywhere.requireHeader = [
				corsAnywhere.requireHeader.toLowerCase(),
			];
		} else if (
			!Array.isArray(corsAnywhere.requireHeader) ||
			corsAnywhere.requireHeader.length === 0
		) {
			corsAnywhere.requireHeader = null;
		} else {
			corsAnywhere.requireHeader = corsAnywhere.requireHeader.map(
				function (headerName) {
					return headerName.toLowerCase();
				},
			);
		}
	}
	corsAnywhere.destinationWhitelist = normalizeDestinationWhitelist(
		corsAnywhere.destinationWhitelist,
	);
	if (typeof corsAnywhere.destinationLookup !== 'function') {
		throw new Error('destinationLookup must be a function.');
	}
	const hasRequiredHeaders = function (headers) {
		return (
			!corsAnywhere.requireHeader ||
			corsAnywhere.requireHeader.some(function (headerName) {
				return Object.hasOwnProperty.call(headers, headerName);
			})
		);
	};
	return function (req, res) {
		req.corsAnywhereRequestState = {
			getProxyForUrl: corsAnywhere.getProxyForUrl,
			maxRedirects: corsAnywhere.maxRedirects,
			corsMaxAge: corsAnywhere.corsMaxAge,
			originWhitelist: corsAnywhere.originWhitelist,
			destinationWhitelist: corsAnywhere.destinationWhitelist,
			destinationLookup: corsAnywhere.destinationLookup,
			validatedLookup: null,
		};
		let location = parseURL(req.url.slice(1));
		if (location) {
			location = resolveNoSchemeHttpsDestination(
				corsAnywhere.destinationWhitelist,
				location,
				req.url,
			);
		}
		const cors_headers = withCORS({}, req);
		if (req.method === 'OPTIONS') {
			const origin = req.headers.origin || '';
			if (
				corsAnywhere.originWhitelist.length &&
				!isOriginAllowed(corsAnywhere, origin)
			) {
				res.writeHead(403, 'Forbidden', cors_headers);
				res.end(
					'The origin "' +
						origin +
						'" was not allowed by the operator of this proxy.',
				);
				return;
			}
			if (
				corsAnywhere.destinationWhitelist != null &&
				location &&
				location.host !== 'iscorsneeded'
			) {
				req.corsAnywhereRequestState.location = location;
				validateDestination(
					req.corsAnywhereRequestState,
					location,
					function (err) {
						if (err) {
							rejectRequest(req, res, err);
							return;
						}
						res.writeHead(200, cors_headers);
						res.end();
					},
				);
				return;
			}
			// Pre-flight request. Reply successfully:
			res.writeHead(200, cors_headers);
			res.end();
			return;
		}
		if (
			corsAnywhere.handleInitialRequest &&
			corsAnywhere.handleInitialRequest(req, res, location)
		) {
			return;
		}
		if (!location) {
			// Special case http:/notenoughslashes, because new users of the library frequently make the
			// mistake of putting this application behind a server/router that normalizes the URL.
			// See https://github.com/Rob--W/cors-anywhere/issues/238#issuecomment-629638853
			if (/^\/https?:\/[^/]/i.test(req.url)) {
				res.writeHead(400, 'Missing slash', cors_headers);
				res.end(
					'The URL is invalid: two slashes are needed after the http(s):.',
				);
				return;
			}
			// Invalid API call. Show how to correctly use the API
			showUsage(corsAnywhere.helpFile, cors_headers, res);
			return;
		}
		if (location.host === 'iscorsneeded') {
			// Is CORS needed? This path is provided so that API consumers can test whether it's necessary
			// to use CORS. The server's reply is always No, because if they can read it, then CORS headers
			// are not necessary.
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('no');
			return;
		}
		if (location.port > 65535) {
			// Port is higher than 65535
			res.writeHead(400, 'Invalid port', cors_headers);
			res.end('Port number too large: ' + location.port);
			return;
		}
		if (
			!/^\/https?:/.test(req.url) &&
			!isValidHostName(location.hostname)
		) {
			// Don't even try to proxy invalid hosts (such as /favicon.ico, /robots.txt)
			res.writeHead(404, 'Invalid host', cors_headers);
			res.end('Invalid host: ' + location.hostname);
			return;
		}
		if (!hasRequiredHeaders(req.headers)) {
			res.writeHead(400, 'Header required', cors_headers);
			res.end(
				'Missing required request header. Must specify one of: ' +
					corsAnywhere.requireHeader,
			);
			return;
		}
		const origin = req.headers.origin || '';
		if (corsAnywhere.originBlacklist.indexOf(origin) >= 0) {
			res.writeHead(403, 'Forbidden', cors_headers);
			res.end(
				'The origin "' +
					origin +
					'" was blacklisted by the operator of this proxy.',
			);
			return;
		}
		if (
			corsAnywhere.originWhitelist.length &&
			corsAnywhere.originWhitelist.indexOf(origin) === -1
		) {
			res.writeHead(403, 'Forbidden', cors_headers);
			res.end(
				'The origin "' +
					origin +
					'" was not whitelisted by the operator of this proxy.',
			);
			return;
		}
		const rateLimitMessage =
			corsAnywhere.checkRateLimit && corsAnywhere.checkRateLimit(origin);
		if (rateLimitMessage) {
			res.writeHead(429, 'Too Many Requests', cors_headers);
			res.end(
				'The origin "' +
					origin +
					'" has sent too many requests.\n' +
					rateLimitMessage,
			);
			return;
		}
		if (
			corsAnywhere.redirectSameOrigin &&
			origin &&
			location.href[origin.length] === '/' &&
			location.href.lastIndexOf(origin, 0) === 0
		) {
			// Send a permanent redirect to offload the server. Badly coded clients should not waste our resources.
			cors_headers.vary = 'origin';
			cors_headers['cache-control'] = 'private';
			cors_headers.location = location.href;
			res.writeHead(301, 'Please use a direct request', cors_headers);
			res.end();
			return;
		}
		const isRequestedOverHttps =
			req.connection.encrypted ||
			/^\s*https/.test(req.headers['x-forwarded-proto']);
		const proxyBaseUrl =
			(isRequestedOverHttps ? 'https://' : 'http://') + req.headers.host;
		corsAnywhere.removeHeaders.forEach(function (header) {
			delete req.headers[header];
		});
		Object.keys(corsAnywhere.setHeaders).forEach(function (header) {
			req.headers[header] = corsAnywhere.setHeaders[header];
		});
		req.corsAnywhereRequestState.location = location;
		req.corsAnywhereRequestState.proxyBaseUrl = proxyBaseUrl;
		validateAndProxyRequest(req, res, proxy);
	};
}
// Create server with default and given values
// Creator still needs to call .listen()
exports.createServer = function createServer(options) {
	options = options || {};
	// Default options:
	const httpProxyOptions = {
		xfwd: true, // Append X-Forwarded-* headers
		secure: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
	};
	// Allow user to override defaults and add own options
	if (options.httpProxyOptions) {
		Object.keys(options.httpProxyOptions).forEach(function (option) {
			httpProxyOptions[option] = options.httpProxyOptions[option];
		});
	}
	const proxy = httpProxy.createServer(httpProxyOptions);
	const requestHandler = getHandler(options, proxy);
	let server;
	if (options.httpsOptions) {
		server = require('https').createServer(
			options.httpsOptions,
			requestHandler,
		);
	} else {
		server = require('http').createServer(requestHandler);
	}
	// When the server fails, just show a 404 instead of Internal server error
	proxy.on('error', function (err, req, res) {
		if (res.headersSent) {
			// This could happen when a protocol error occurs when an error occurs
			// after the headers have been received (and forwarded). Do not write
			// the headers because it would generate an error.
			// Prior to Node 13.x, the stream would have ended.
			// As of Node 13.x, we must explicitly close it.
			if (res.writableEnded === false) {
				res.end();
			}
			return;
		}
		// When the error occurs after setting headers but before writing the response,
		// then any previously set headers must be removed.
		const headerNames = res.getHeaderNames
			? res.getHeaderNames()
			: Object.keys(res._headers || {});
		headerNames.forEach(function (name) {
			res.removeHeader(name);
		});
		res.writeHead(404, withCORS({}, req));
		res.end('Not found because of proxy error: ' + err);
	});
	return server;
};
//# sourceMappingURL=cors-anywhere.js.map
