'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _apolloServerExpress = require('apollo-server-express');

var _graphqlResolvers = require('graphql-resolvers');

var _authorization = require('./authorization');

var _subscription = require('../subscription');

var _subscription2 = _interopRequireDefault(_subscription);

var _relationships = require('../models/relationships');

var _relationships2 = _interopRequireDefault(_relationships);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var Op = _sequelize2.default.Op;

var storeUpload = function storeUpload(_ref) {
	var stream = _ref.stream,
	    mimetype = _ref.mimetype,
	    s3 = _ref.s3;
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
				resolve(data.key);
				// file_url: data.Location,data.key)
			}
		});

		stream.on('end', function () {
			return console.log('end');
		});
		stream.on('error', reject);
	});
};

exports.default = {
	Query: {
		posts: function () {
			var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(parent, _ref3, _ref4) {
				var limit = _ref3.limit;
				var models = _ref4.models;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								_context.next = 2;
								return models.Post.findAll();

							case 2:
								return _context.abrupt('return', _context.sent);

							case 3:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, undefined);
			}));

			return function posts(_x, _x2, _x3) {
				return _ref2.apply(this, arguments);
			};
		}(),
		post: function () {
			var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(parent, _ref6, _ref7) {
				var id = _ref6.id;
				var models = _ref7.models;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return models.Post.findById(id, {
									include: [models.User]
								});

							case 2:
								return _context2.abrupt('return', _context2.sent);

							case 3:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, undefined);
			}));

			return function post(_x4, _x5, _x6) {
				return _ref5.apply(this, arguments);
			};
		}(),

		feed: function () {
			var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(parent, _ref9, _ref10) {
				var offset = _ref9.offset,
				    limit = _ref9.limit;
				var models = _ref10.models,
				    me = _ref10.me;
				var users, usersArr;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:

								console.log(limit, offset);

								_context3.next = 3;
								return models.Relationship.findAll({
									where: { follower_id: me.id }
								});

							case 3:
								users = _context3.sent;
								_context3.next = 6;
								return users.map(function (user) {
									return user.dataValues.followed_id;
								});

							case 6:
								usersArr = _context3.sent;


								usersArr.push(me.id);

								_context3.next = 10;
								return models.Post.findAll({
									limit: limit,
									offset: offset,
									where: {
										userId: _defineProperty({}, Op.or, usersArr)
									},

									include: [{
										model: models.User
									}, {
										model: models.File
									}],

									order: [['createdAt', 'DESC']]
								});

							case 10:
								return _context3.abrupt('return', _context3.sent);

							case 11:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, undefined);
			}));

			return function feed(_x7, _x8, _x9) {
				return _ref8.apply(this, arguments);
			};
		}()
	},

	Mutation: {

		createPost: (0, _graphqlResolvers.combineResolvers)(_authorization.isAuthenticated, function () {
			var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(parent, _ref12, _ref13) {
				var text = _ref12.text,
				    media = _ref12.media,
				    type = _ref12.type;
				var me = _ref13.me,
				    models = _ref13.models,
				    s3 = _ref13.s3,
				    mixpanel = _ref13.mixpanel;
				var post, followers, usersArr;
				return regeneratorRuntime.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:

								if (!type) {
									type = 'Default';
								}

								_context6.next = 3;
								return mixpanel.track('Created post', {
									distinct_id: me.id,
									media: media !== undefined ? true : false,
									text: text,
									type: type,
									time: new Date()
								});

							case 3:
								_context6.next = 5;
								return models.Post.create({
									text: text,
									userId: me.id,
									type: type
								}).then(function () {
									var _ref14 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(post) {
										var id, _ref15, stream, filename, mimetype, fileKey;

										return regeneratorRuntime.wrap(function _callee5$(_context5) {
											while (1) {
												switch (_context5.prev = _context5.next) {
													case 0:
														console.log(post.dataValues.id);
														id = post.dataValues.id;

														if (!(media !== null && media !== undefined)) {
															_context5.next = 22;
															break;
														}

														console.log(media);

														if (!(media.length === 1)) {
															_context5.next = 19;
															break;
														}

														_context5.next = 7;
														return media[0];

													case 7:
														_ref15 = _context5.sent;
														stream = _ref15.stream;
														filename = _ref15.filename;
														mimetype = _ref15.mimetype;
														_context5.next = 13;
														return storeUpload({ stream: stream, s3: s3, mimetype: mimetype }).then(function (value) {
															console.log(value);
															return value;
														});

													case 13:
														fileKey = _context5.sent;
														_context5.next = 16;
														return models.File.create({
															key: fileKey,
															postId: id
														});

													case 16:
														return _context5.abrupt('return', post);

													case 19:
														if (!(media.length > 1)) {
															_context5.next = 22;
															break;
														}

														_context5.next = 22;
														return media.forEach(function () {
															var _ref16 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(file) {
																var _ref17, stream, filename, mimetype;

																return regeneratorRuntime.wrap(function _callee4$(_context4) {
																	while (1) {
																		switch (_context4.prev = _context4.next) {
																			case 0:
																				_context4.next = 2;
																				return file;

																			case 2:
																				_ref17 = _context4.sent;
																				stream = _ref17.stream;
																				filename = _ref17.filename;
																				mimetype = _ref17.mimetype;

																				console.log(">>>>>>>>>>>>>", stream, filename, mimetype);
																				_context4.next = 9;
																				return storeUpload({ stream: stream, s3: s3, mimetype: mimetype }).then(function (value) {
																					console.log(value);
																					models.File.create({
																						key: value,
																						postId: id
																					});
																				});

																			case 9:
																			case 'end':
																				return _context4.stop();
																		}
																	}
																}, _callee4, undefined);
															}));

															return function (_x14) {
																return _ref16.apply(this, arguments);
															};
														}());

													case 22:
														return _context5.abrupt('return', post);

													case 23:
													case 'end':
														return _context5.stop();
												}
											}
										}, _callee5, undefined);
									}));

									return function (_x13) {
										return _ref14.apply(this, arguments);
									};
								}());

							case 5:
								post = _context6.sent;
								_context6.next = 8;
								return models.Relationship.findAll({
									where: { followed_id: me.id }
								});

							case 8:
								followers = _context6.sent;
								_context6.next = 11;
								return followers.map(function (user) {
									return user.dataValues.follower_id;
								});

							case 11:
								usersArr = _context6.sent;


								_subscription2.default.publish(_subscription.EVENTS.POST.CREATED, {
									postAddedToFeed: {
										post: post,
										followersToNotify: usersArr
									}
								});

								return _context6.abrupt('return', post);

							case 14:
							case 'end':
								return _context6.stop();
						}
					}
				}, _callee6, undefined);
			}));

			return function (_x10, _x11, _x12) {
				return _ref11.apply(this, arguments);
			};
		}())

	},

	Post: {
		// user: async (post, args, { models }) => {
		// 	return await models.User.findById(post.userId)
		// },

		createdAt: function () {
			var _ref18 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(post, args, _ref19) {
				var models = _ref19.models;
				return regeneratorRuntime.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								return _context7.abrupt('return', post.createdAt.toString());

							case 1:
							case 'end':
								return _context7.stop();
						}
					}
				}, _callee7, undefined);
			}));

			return function createdAt(_x15, _x16, _x17) {
				return _ref18.apply(this, arguments);
			};
		}(),

		likes: function () {
			var _ref20 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(post, args, _ref21) {
				var models = _ref21.models;
				return regeneratorRuntime.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								_context8.next = 2;
								return models.Like.findAndCountAll({
									where: {
										post_id: post.id
									}
								}).then(function (count) {
									return count.count;
								});

							case 2:
								return _context8.abrupt('return', _context8.sent);

							case 3:
							case 'end':
								return _context8.stop();
						}
					}
				}, _callee8, undefined);
			}));

			return function likes(_x18, _x19, _x20) {
				return _ref20.apply(this, arguments);
			};
		}(),

		media: function () {
			var _ref22 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(post, args, _ref23) {
				var models = _ref23.models;
				return regeneratorRuntime.wrap(function _callee9$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								_context9.next = 2;
								return models.File.findAll({
									where: { postId: post.id }
								});

							case 2:
								return _context9.abrupt('return', _context9.sent);

							case 3:
							case 'end':
								return _context9.stop();
						}
					}
				}, _callee9, undefined);
			}));

			return function media(_x21, _x22, _x23) {
				return _ref22.apply(this, arguments);
			};
		}(),

		liked: function () {
			var _ref24 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(post, args, _ref25) {
				var models = _ref25.models,
				    me = _ref25.me;
				var likedStatus;
				return regeneratorRuntime.wrap(function _callee10$(_context10) {
					while (1) {
						switch (_context10.prev = _context10.next) {
							case 0:
								if (me) {
									_context10.next = 2;
									break;
								}

								return _context10.abrupt('return', null);

							case 2:
								_context10.next = 4;
								return models.Like.findOne({
									where: {
										post_id: post.id,
										user_id: me.id
									}
								});

							case 4:
								likedStatus = _context10.sent;

								if (!(likedStatus === null)) {
									_context10.next = 7;
									break;
								}

								return _context10.abrupt('return', false);

							case 7:
								return _context10.abrupt('return', true);

							case 8:
							case 'end':
								return _context10.stop();
						}
					}
				}, _callee10, undefined);
			}));

			return function liked(_x24, _x25, _x26) {
				return _ref24.apply(this, arguments);
			};
		}()
	},

	Subscription: {
		postAddedToFeed: {
			subscribe: (0, _apolloServerExpress.withFilter)(function () {
				return _subscription2.default.asyncIterator(_subscription.EVENTS.POST.CREATED);
			}, function (payload, variables) {
				console.log(payload, '||', variables);
				return payload.postAddedToFeed.followersToNotify.includes(variables.feedOwner);
			})
		}
	}
};