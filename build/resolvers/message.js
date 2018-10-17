'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _graphqlResolvers = require('graphql-resolvers');

var _authorization = require('./authorization');

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = {
	Query: {
		messages: function () {
			var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(parent, _ref2, _ref3) {
				var limit = _ref2.limit;
				var models = _ref3.models;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								if (limit) {
									_context.next = 4;
									break;
								}

								_context.next = 3;
								return models.Message.findAll();

							case 3:
								return _context.abrupt('return', _context.sent);

							case 4:
								_context.next = 6;
								return models.Message.findAll({ limit: limit });

							case 6:
								return _context.abrupt('return', _context.sent);

							case 7:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, undefined);
			}));

			return function messages(_x, _x2, _x3) {
				return _ref.apply(this, arguments);
			};
		}(),
		message: function () {
			var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(parent, _ref5, _ref6) {
				var id = _ref5.id;
				var models = _ref6.models;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return models.Message.findById(id);

							case 2:
								return _context2.abrupt('return', _context2.sent);

							case 3:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, undefined);
			}));

			return function message(_x4, _x5, _x6) {
				return _ref4.apply(this, arguments);
			};
		}()
	},

	Mutation: {
		createMessage: (0, _graphqlResolvers.combineResolvers)(_authorization.isAuthenticated, function () {
			var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(parent, _ref8, _ref9) {
				var text = _ref8.text;
				var me = _ref9.me,
				    models = _ref9.models;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								_context3.next = 2;
								return models.Message.create({
									text: text,
									userId: me.id
								});

							case 2:
								return _context3.abrupt('return', _context3.sent);

							case 3:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, undefined);
			}));

			return function (_x7, _x8, _x9) {
				return _ref7.apply(this, arguments);
			};
		}()),

		deleteMessage: function () {
			var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(parent, _ref11, _ref12) {
				var id = _ref11.id;
				var models = _ref12.models;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								_context4.next = 2;
								return models.Message.destroy({ where: { id: id } });

							case 2:
								return _context4.abrupt('return', _context4.sent);

							case 3:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, undefined);
			}));

			return function deleteMessage(_x10, _x11, _x12) {
				return _ref10.apply(this, arguments);
			};
		}()
	},

	Message: {
		user: function () {
			var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(message, args, _ref14) {
				var models = _ref14.models;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								_context5.next = 2;
								return models.User.findById(message.userId);

							case 2:
								return _context5.abrupt('return', _context5.sent);

							case 3:
							case 'end':
								return _context5.stop();
						}
					}
				}, _callee5, undefined);
			}));

			return function user(_x13, _x14, _x15) {
				return _ref13.apply(this, arguments);
			};
		}()
	}
};