'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _apolloServerExpress = require('apollo-server-express');

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var Op = _sequelize2.default.Op;

var createToken = function () {
	var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(user, secret, expiresIn) {
		var id, email, username;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						id = user.id, email = user.email, username = user.username;
						_context.next = 3;
						return _jsonwebtoken2.default.sign({ id: id, email: email, username: username }, secret);

					case 3:
						return _context.abrupt('return', _context.sent);

					case 4:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, undefined);
	}));

	return function createToken(_x, _x2, _x3) {
		return _ref.apply(this, arguments);
	};
}();

var storeUpload = function storeUpload(_ref2) {
	var stream = _ref2.stream,
	    mimetype = _ref2.mimetype,
	    s3 = _ref2.s3;
	return new Promise(function (resolve, reject) {
		var uuidFilename = (0, _v2.default)();

		var params = {
			Bucket: 'pageify',
			Body: stream,
			Key: uuidFilename,
			ContentType: mimetype,
			ACL: 'public-read'
		};

		s3.upload(params, function (err, data) {
			if (err) {
				return console.error('Error', err);
			}

			if (data) {
				console.log(data);
				resolve(data.Location);
			}
		});

		stream.on('end', function () {
			return console.log('end');
		});
		stream.on('error', reject);
	});
};

exports.default = {
	Results: {
		__resolveType: function __resolveType(obj, context, info) {
			if (obj.username) {
				return 'User';
			}

			if (obj.text) {
				return 'Post';
			}

			return null;
		}
	},

	Query: {
		users: function () {
			var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(parent, args, _ref4) {
				var models = _ref4.models;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return models.User.findAll({ include: [models.Message] });

							case 2:
								return _context2.abrupt('return', _context2.sent);

							case 3:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, undefined);
			}));

			return function users(_x4, _x5, _x6) {
				return _ref3.apply(this, arguments);
			};
		}(),
		user: function () {
			var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(parent, _ref6, _ref7) {
				var id = _ref6.id;
				var models = _ref7.models;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								console.log('jere');
								_context3.next = 3;
								return models.User.findById(id, { include: [models.Message] });

							case 3:
								return _context3.abrupt('return', _context3.sent);

							case 4:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, undefined);
			}));

			return function user(_x7, _x8, _x9) {
				return _ref5.apply(this, arguments);
			};
		}(),
		me: function () {
			var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(parent, args, _ref9) {
				var models = _ref9.models,
				    _me = _ref9.me;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								if (_me) {
									_context4.next = 2;
									break;
								}

								throw new _apolloServerExpress.AuthenticationError('Missing token. Please sign in again. stack-trace: [/resolvers/user]');

							case 2:
								_context4.next = 4;
								return models.User.findById(_me.id, { include: [models.Message] });

							case 4:
								return _context4.abrupt('return', _context4.sent);

							case 5:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, undefined);
			}));

			return function me(_x10, _x11, _x12) {
				return _ref8.apply(this, arguments);
			};
		}(),
		search: function () {
			var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(parent, _ref11, _ref12) {
				var query = _ref11.query;
				var models = _ref12.models,
				    me = _ref12.me;
				var Users, Posts, Results;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								_context5.next = 2;
								return models.User.findAll({
									limit: 20,
									where: {
										username: _defineProperty({}, Op.like, '%' + query + '%')
									}
								});

							case 2:
								Users = _context5.sent;
								_context5.next = 5;
								return models.Post.findAll({
									where: {
										text: _defineProperty({}, Op.like, '%' + query + '%')
									}
								});

							case 5:
								Posts = _context5.sent;
								Results = Users.concat(Posts);
								return _context5.abrupt('return', Results);

							case 8:
							case 'end':
								return _context5.stop();
						}
					}
				}, _callee5, undefined);
			}));

			return function search(_x13, _x14, _x15) {
				return _ref10.apply(this, arguments);
			};
		}()
	},

	Mutation: {
		signUp: function () {
			var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(parent, _ref14, _ref15) {
				var username = _ref14.username,
				    email = _ref14.email,
				    password = _ref14.password;
				var models = _ref15.models,
				    secret = _ref15.secret;
				var user;
				return regeneratorRuntime.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								_context6.prev = 0;
								_context6.next = 3;
								return models.User.create({
									username: username,
									email: email,
									password: password
								}).then(function (user) {
									mixpanel.track('Created account', {
										distinct_id: user.dataValues.id,
										time: new Date()
									});

									mixpanel.people.set(user.dataValues.id, {
										$name: user.dataValues.username,
										$email: user.dataValues.email,
										$created: new Date().toISOString()
									});

									return user;
								});

							case 3:
								user = _context6.sent;
								return _context6.abrupt('return', { token: createToken(user, secret) });

							case 7:
								_context6.prev = 7;
								_context6.t0 = _context6['catch'](0);
								throw new Error(_context6.t0.errors[0].message);

							case 10:
							case 'end':
								return _context6.stop();
						}
					}
				}, _callee6, undefined, [[0, 7]]);
			}));

			return function signUp(_x16, _x17, _x18) {
				return _ref13.apply(this, arguments);
			};
		}(),

		signIn: function () {
			var _ref16 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(parent, _ref17, _ref18) {
				var login = _ref17.login,
				    password = _ref17.password;
				var models = _ref18.models,
				    secret = _ref18.secret;
				var user, isValid;
				return regeneratorRuntime.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								_context7.next = 2;
								return models.User.findByLogin(login);

							case 2:
								user = _context7.sent;

								if (user) {
									_context7.next = 5;
									break;
								}

								throw new _apolloServerExpress.UserInputError('No user found with these login credentials');

							case 5:
								_context7.next = 7;
								return user.validatePassword(password);

							case 7:
								isValid = _context7.sent;

								if (isValid) {
									_context7.next = 10;
									break;
								}

								throw new _apolloServerExpress.AuthenticationError('Invalid password');

							case 10:
								return _context7.abrupt('return', { token: createToken(user, secret) });

							case 11:
							case 'end':
								return _context7.stop();
						}
					}
				}, _callee7, undefined);
			}));

			return function signIn(_x19, _x20, _x21) {
				return _ref16.apply(this, arguments);
			};
		}(),

		updateAvatar: function () {
			var _ref19 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(parent, _ref20, _ref21) {
				var file = _ref20.file;
				var models = _ref21.models,
				    me = _ref21.me,
				    s3 = _ref21.s3;

				var _ref22, stream, filename, mimetype, encoding, file_url, updateAvi;

				return regeneratorRuntime.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								_context8.next = 2;
								return file;

							case 2:
								_ref22 = _context8.sent;
								stream = _ref22.stream;
								filename = _ref22.filename;
								mimetype = _ref22.mimetype;
								encoding = _ref22.encoding;
								_context8.next = 9;
								return storeUpload({ stream: stream, s3: s3, mimetype: mimetype }).then(function (value) {
									console.log('update avatar resolver', value);
									// file_url = value
									return value;
								});

							case 9:
								file_url = _context8.sent;
								_context8.next = 12;
								return models.User.update({
									avatar: file_url
								}, {
									where: {
										id: me.id
									}
								});

							case 12:
								updateAvi = _context8.sent;

								if (!updateAvi) {
									_context8.next = 15;
									break;
								}

								return _context8.abrupt('return', true);

							case 15:
								return _context8.abrupt('return', false);

							case 16:
							case 'end':
								return _context8.stop();
						}
					}
				}, _callee8, undefined);
			}));

			return function updateAvatar(_x22, _x23, _x24) {
				return _ref19.apply(this, arguments);
			};
		}(),

		followUser: function () {
			var _ref23 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(parent, _ref24, _ref25) {
				var userId = _ref24.userId;
				var models = _ref25.models,
				    me = _ref25.me;
				var current_user, other_user, alreadyFollowing, followSuccess;
				return regeneratorRuntime.wrap(function _callee9$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								if (me) {
									_context9.next = 2;
									break;
								}

								return _context9.abrupt('return', new _apolloServerExpress.AuthenticationError('Must be signed in to follow users'));

							case 2:
								_context9.next = 4;
								return models.User.findById(me.id);

							case 4:
								current_user = _context9.sent;
								_context9.next = 7;
								return models.User.findById(userId);

							case 7:
								other_user = _context9.sent;

								if (!(current_user.id === other_user.id)) {
									_context9.next = 10;
									break;
								}

								return _context9.abrupt('return', new _apolloServerExpress.UserInputError('Can\'t follow yourself bud.'));

							case 10:
								_context9.next = 12;
								return current_user.following(other_user);

							case 12:
								alreadyFollowing = _context9.sent;
								_context9.next = 15;
								return current_user.follow(other_user);

							case 15:
								followSuccess = _context9.sent;

								if (!alreadyFollowing) {
									_context9.next = 20;
									break;
								}

								return _context9.abrupt('return', new _apolloServerExpress.UserInputError('Already following this user'));

							case 20:
								if (!followSuccess) {
									_context9.next = 22;
									break;
								}

								return _context9.abrupt('return', true);

							case 22:
								return _context9.abrupt('return', false);

							case 23:
							case 'end':
								return _context9.stop();
						}
					}
				}, _callee9, undefined);
			}));

			return function followUser(_x25, _x26, _x27) {
				return _ref23.apply(this, arguments);
			};
		}(),

		unfollowUser: function () {
			var _ref26 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(parent, _ref27, _ref28) {
				var userId = _ref27.userId;
				var models = _ref28.models,
				    me = _ref28.me;
				var current_user, other_user, unfollowSuccess;
				return regeneratorRuntime.wrap(function _callee10$(_context10) {
					while (1) {
						switch (_context10.prev = _context10.next) {
							case 0:
								if (me) {
									_context10.next = 2;
									break;
								}

								return _context10.abrupt('return', new _apolloServerExpress.AuthenticationError('Must be signed in to unfollow users'));

							case 2:
								_context10.next = 4;
								return models.User.findById(me.id);

							case 4:
								current_user = _context10.sent;
								_context10.next = 7;
								return models.User.findById(userId);

							case 7:
								other_user = _context10.sent;
								_context10.next = 10;
								return current_user.unfollow(other_user);

							case 10:
								unfollowSuccess = _context10.sent;


								console.log('asdasdasd', unfollowSuccess);

								if (!unfollowSuccess) {
									_context10.next = 14;
									break;
								}

								return _context10.abrupt('return', true);

							case 14:
								return _context10.abrupt('return', false);

							case 15:
							case 'end':
								return _context10.stop();
						}
					}
				}, _callee10, undefined);
			}));

			return function unfollowUser(_x28, _x29, _x30) {
				return _ref26.apply(this, arguments);
			};
		}(),

		likePost: function () {
			var _ref29 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(parent, _ref30, _ref31) {
				var postId = _ref30.postId;
				var models = _ref31.models,
				    me = _ref31.me;
				var current_user, post;
				return regeneratorRuntime.wrap(function _callee11$(_context11) {
					while (1) {
						switch (_context11.prev = _context11.next) {
							case 0:
								if (me) {
									_context11.next = 2;
									break;
								}

								return _context11.abrupt('return', new _apolloServerExpress.AuthenticationError('Must be signed in to like posts'));

							case 2:
								_context11.next = 4;
								return models.User.findById(me.id);

							case 4:
								current_user = _context11.sent;
								_context11.next = 7;
								return models.Post.findById(postId);

							case 7:
								post = _context11.sent;
								_context11.next = 10;
								return current_user.getLikes({
									where: {
										id: postId
									}
								}).then(function (like) {
									if (like[0] === undefined) {
										console.log('no like found');
										current_user.setLike(post);
										return true;
									} else {
										// console.log(like[0])
										current_user.removeLike(post);
										return false;
									}
								});

							case 10:
								return _context11.abrupt('return', _context11.sent);

							case 11:
							case 'end':
								return _context11.stop();
						}
					}
				}, _callee11, undefined);
			}));

			return function likePost(_x31, _x32, _x33) {
				return _ref29.apply(this, arguments);
			};
		}()
	},

	User: {

		// messages: async (user, args, { models }) => {
		// 	return await models.Message.findAll({
		// 		where: {
		// 			userId: user.id,
		// 		},
		// 	});
		// },

		posts: function () {
			var _ref32 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(user, _ref33, _ref34) {
				var limit = _ref33.limit,
				    offset = _ref33.offset;
				var models = _ref34.models;
				return regeneratorRuntime.wrap(function _callee12$(_context12) {
					while (1) {
						switch (_context12.prev = _context12.next) {
							case 0:
								console.log('POSTS ARGS', limit, offset);
								_context12.next = 3;
								return models.Post.findAll({
									limit: limit,
									offset: offset,
									where: {
										userId: user.id
									},
									order: [['createdAt', 'DESC']]
								});

							case 3:
								return _context12.abrupt('return', _context12.sent);

							case 4:
							case 'end':
								return _context12.stop();
						}
					}
				}, _callee12, undefined);
			}));

			return function posts(_x34, _x35, _x36) {
				return _ref32.apply(this, arguments);
			};
		}(),

		posts_count: function () {
			var _ref35 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(user, args, _ref36) {
				var models = _ref36.models;
				return regeneratorRuntime.wrap(function _callee13$(_context13) {
					while (1) {
						switch (_context13.prev = _context13.next) {
							case 0:
								_context13.next = 2;
								return models.Post.findAndCountAll({
									where: {
										userId: user.id
									}
								}).then(function (result) {
									return result.count;
								});

							case 2:
								return _context13.abrupt('return', _context13.sent);

							case 3:
							case 'end':
								return _context13.stop();
						}
					}
				}, _callee13, undefined);
			}));

			return function posts_count(_x37, _x38, _x39) {
				return _ref35.apply(this, arguments);
			};
		}(),

		following: function () {
			var _ref37 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(user, args, _ref38) {
				var me = _ref38.me,
				    models = _ref38.models;
				var current_user, other_user;
				return regeneratorRuntime.wrap(function _callee14$(_context14) {
					while (1) {
						switch (_context14.prev = _context14.next) {
							case 0:
								if (me) {
									_context14.next = 2;
									break;
								}

								return _context14.abrupt('return', null);

							case 2:
								_context14.next = 4;
								return models.User.findById(me.id);

							case 4:
								current_user = _context14.sent;
								_context14.next = 7;
								return models.User.findById(user.id);

							case 7:
								other_user = _context14.sent;
								_context14.next = 10;
								return current_user.following(other_user);

							case 10:
								return _context14.abrupt('return', _context14.sent);

							case 11:
							case 'end':
								return _context14.stop();
						}
					}
				}, _callee14, undefined);
			}));

			return function following(_x40, _x41, _x42) {
				return _ref37.apply(this, arguments);
			};
		}(),

		followers_count: function () {
			var _ref39 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(user, args, _ref40) {
				var me = _ref40.me,
				    models = _ref40.models;
				return regeneratorRuntime.wrap(function _callee15$(_context15) {
					while (1) {
						switch (_context15.prev = _context15.next) {
							case 0:
								_context15.next = 2;
								return models.Relationship.findAndCountAll({
									where: {
										followed_id: user.id
									}
								}).then(function (result) {
									return result.count;
								});

							case 2:
								return _context15.abrupt('return', _context15.sent);

							case 3:
							case 'end':
								return _context15.stop();
						}
					}
				}, _callee15, undefined);
			}));

			return function followers_count(_x43, _x44, _x45) {
				return _ref39.apply(this, arguments);
			};
		}(),

		following_count: function () {
			var _ref41 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(user, args, _ref42) {
				var me = _ref42.me,
				    models = _ref42.models;
				return regeneratorRuntime.wrap(function _callee16$(_context16) {
					while (1) {
						switch (_context16.prev = _context16.next) {
							case 0:
								_context16.next = 2;
								return models.Relationship.findAndCountAll({
									where: {
										follower_id: user.id
									}
								}).then(function (result) {
									return result.count;
								});

							case 2:
								return _context16.abrupt('return', _context16.sent);

							case 3:
							case 'end':
								return _context16.stop();
						}
					}
				}, _callee16, undefined);
			}));

			return function following_count(_x46, _x47, _x48) {
				return _ref41.apply(this, arguments);
			};
		}(),

		followers_array: function () {
			var _ref43 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(user, args, _ref44) {
				var me = _ref44.me,
				    models = _ref44.models;
				var followers, arr;
				return regeneratorRuntime.wrap(function _callee17$(_context17) {
					while (1) {
						switch (_context17.prev = _context17.next) {
							case 0:
								_context17.next = 2;
								return models.Relationship.findAll({
									where: { followed_id: user.id }
								});

							case 2:
								followers = _context17.sent;
								_context17.next = 5;
								return followers.map(function (user) {
									return user.dataValues.follower_id;
								});

							case 5:
								arr = _context17.sent;
								return _context17.abrupt('return', arr);

							case 7:
							case 'end':
								return _context17.stop();
						}
					}
				}, _callee17, undefined);
			}));

			return function followers_array(_x49, _x50, _x51) {
				return _ref43.apply(this, arguments);
			};
		}()

	}

};