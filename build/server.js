'use strict';

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _bodyParser = require('body-parser');

var bodyParser = _interopRequireWildcard(_bodyParser);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _timber = require('timber');

var _timber2 = _interopRequireDefault(_timber);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _apolloServerExpress = require('apollo-server-express');

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _mixpanel = require('mixpanel');

var _mixpanel2 = _interopRequireDefault(_mixpanel);

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _resolvers = require('./resolvers');

var _resolvers2 = _interopRequireDefault(_resolvers);

var _models = require('./models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('dotenv').config();


var transport = new _timber2.default.transports.HTTPS('' + process.env.TIMBER_API);
if (process.env.NODE_ENV === 'production') {
	_timber2.default.install(transport);
}

_awsSdk2.default.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_KEY
});

var spacesEndpoint = new _awsSdk2.default.Endpoint(process.env.SPACE_ENDPOINT);

var s3 = new _awsSdk2.default.S3({
	endpoint: spacesEndpoint
});

var mixpanel = _mixpanel2.default.init('cf9c61b9e7ac9e9d8b06f8b91c0023b4');

var PORT = process.env.PORT || 9000;

var app = (0, _express2.default)();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use((0, _cors2.default)());

var getMe = function () {
	var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req) {
		var token;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						token = req.headers['x-token'];

						if (!token) {
							_context.next = 11;
							break;
						}

						_context.prev = 2;
						_context.next = 5;
						return _jsonwebtoken2.default.verify(token, process.env.SECRET);

					case 5:
						return _context.abrupt('return', _context.sent);

					case 8:
						_context.prev = 8;
						_context.t0 = _context['catch'](2);
						throw new _apolloServerExpress.AuthenticationError('Your session has expired. Please sign in again.');

					case 11:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, undefined, [[2, 8]]);
	}));

	return function getMe(_x) {
		return _ref.apply(this, arguments);
	};
}();

var server = new _apolloServerExpress.ApolloServer(_defineProperty({
	typeDefs: _schema2.default,
	resolvers: _resolvers2.default,
	engine: {
		apiKey: "service:d3vhound-pageify090418:IJ9a3TLVbX3q8TUJ_AfWhw"
	},
	context: function () {
		var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref3) {
			var req = _ref3.req,
			    connection = _ref3.connection;
			var me;
			return regeneratorRuntime.wrap(function _callee2$(_context2) {
				while (1) {
					switch (_context2.prev = _context2.next) {
						case 0:
							if (!connection) {
								_context2.next = 3;
								break;
							}

							console.log('connection');
							return _context2.abrupt('return', {
								models: _models2.default
							});

						case 3:
							if (!req) {
								_context2.next = 11;
								break;
							}

							_context2.next = 6;
							return getMe(req);

						case 6:
							me = _context2.sent;

							console.log('-------------');
							console.log('me user >', me);
							console.log('-------------');

							return _context2.abrupt('return', {
								models: _models2.default,
								me: me,
								mixpanel: mixpanel,
								secret: process.env.SECRET,
								s3: s3
							});

						case 11:
						case 'end':
							return _context2.stop();
					}
				}
			}, _callee2, undefined);
		}));

		return function context(_x2) {
			return _ref2.apply(this, arguments);
		};
	}(),
	introspection: true,
	playground: true,
	tracing: true
}, 'playground', {
	settings: {
		'editor.theme': 'dark',
		"editor.cursorShape": "block"
	}
}));

server.applyMiddleware({ app: app, path: '/graphql' });

var httpServer = _http2.default.createServer(app);
server.installSubscriptionHandlers(httpServer);

var eraseDatabaseOnSync = true;

_models.sequelize.sync({ force: eraseDatabaseOnSync }).then(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
	return regeneratorRuntime.wrap(function _callee3$(_context3) {
		while (1) {
			switch (_context3.prev = _context3.next) {
				case 0:
					if (eraseDatabaseOnSync) {
						createUsersWithMessages();
					}

					httpServer.listen({ port: PORT }, function () {
						console.log('\uD83D\uDE80 Server running on localhost:' + PORT + server.graphqlPath);
					});

				case 2:
				case 'end':
					return _context3.stop();
			}
		}
	}, _callee3, undefined);
})));

var createUsersWithMessages = function () {
	var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
		return regeneratorRuntime.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						_context4.next = 2;
						return _models2.default.User.create({
							username: 'dvillegas',
							email: 'devion.villegas@ttu.edu',
							password: 'test123',
							messages: [{
								text: 'GraphQL is lit'
							}]
						}, {
							include: [_models2.default.Message]
						});

					case 2:
						_context4.next = 4;
						return _models2.default.User.create({
							username: 'jp',
							email: 'jp@nextgencode.io',
							password: 'test123',
							messages: [{
								text: 'SQL god'
							}, {
								text: 'PHP over everything'
							}]
						}, {
							include: [_models2.default.Message]
						});

					case 4:
					case 'end':
						return _context4.stop();
				}
			}
		}, _callee4, undefined);
	}));

	return function createUsersWithMessages() {
		return _ref6.apply(this, arguments);
	};
}();