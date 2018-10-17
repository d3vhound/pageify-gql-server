'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var user = function user(sequelize, DataTypes) {
	var User = sequelize.define('user', {
		username: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		email: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
			validate: {
				notEmpty: true,
				isEmail: true
			}
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [7, 42]
			}
		},
		avatar: {
			type: DataTypes.STRING
		},
		bio: {
			type: DataTypes.STRING,
			validate: {
				len: [0, 140]
			}
		}
	});

	User.associate = function (models) {
		User.hasMany(models.Message);
		User.hasMany(models.Post);
		User.belongsToMany(models.Post, {
			as: 'likes',
			through: {
				model: models.Like,
				unique: false
			},
			foreignKey: 'user_id',
			onDelete: 'cascade',
			hooks: true
		});
		User.belongsToMany(User, {
			as: 'following',
			through: models.Relationship,
			foreignKey: 'follower_id',
			onDelete: 'cascade',
			hooks: true
		});
		User.belongsToMany(User, {
			as: 'followers',
			through: models.Relationship,
			foreignKey: 'followed_id',
			onDelete: 'cascade',
			hooks: true
		});
	};

	User.findByLogin = function () {
		var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(login) {
			var user;
			return regeneratorRuntime.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							_context.next = 2;
							return User.findOne({
								where: { username: login }
							});

						case 2:
							user = _context.sent;

							if (user) {
								_context.next = 7;
								break;
							}

							_context.next = 6;
							return User.findOne({
								where: { email: login }
							});

						case 6:
							user = _context.sent;

						case 7:
							return _context.abrupt('return', user);

						case 8:
						case 'end':
							return _context.stop();
					}
				}
			}, _callee, undefined);
		}));

		return function (_x) {
			return _ref.apply(this, arguments);
		};
	}();

	User.beforeCreate(function () {
		var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(user) {
			return regeneratorRuntime.wrap(function _callee2$(_context2) {
				while (1) {
					switch (_context2.prev = _context2.next) {
						case 0:
							_context2.next = 2;
							return user.generatePasswordHash();

						case 2:
							user.password = _context2.sent;

						case 3:
						case 'end':
							return _context2.stop();
					}
				}
			}, _callee2, undefined);
		}));

		return function (_x2) {
			return _ref2.apply(this, arguments);
		};
	}());

	User.prototype.setLike = function () {
		var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(user) {
			return regeneratorRuntime.wrap(function _callee3$(_context3) {
				while (1) {
					switch (_context3.prev = _context3.next) {
						case 0:
							return _context3.abrupt('return', this.addLike(user));

						case 1:
						case 'end':
							return _context3.stop();
					}
				}
			}, _callee3, this);
		}));

		return function (_x3) {
			return _ref3.apply(this, arguments);
		};
	}();

	User.prototype.follow = function () {
		var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(user) {
			return regeneratorRuntime.wrap(function _callee4$(_context4) {
				while (1) {
					switch (_context4.prev = _context4.next) {
						case 0:
							return _context4.abrupt('return', this.addFollowing(user));

						case 1:
						case 'end':
							return _context4.stop();
					}
				}
			}, _callee4, this);
		}));

		return function (_x4) {
			return _ref4.apply(this, arguments);
		};
	}();

	User.prototype.unfollow = function () {
		var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(user) {
			return regeneratorRuntime.wrap(function _callee5$(_context5) {
				while (1) {
					switch (_context5.prev = _context5.next) {
						case 0:
							return _context5.abrupt('return', this.removeFollowing(user));

						case 1:
						case 'end':
							return _context5.stop();
					}
				}
			}, _callee5, this);
		}));

		return function (_x5) {
			return _ref5.apply(this, arguments);
		};
	}();

	User.prototype.following = function () {
		var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(user) {
			return regeneratorRuntime.wrap(function _callee6$(_context6) {
				while (1) {
					switch (_context6.prev = _context6.next) {
						case 0:
							return _context6.abrupt('return', this.hasFollowing(user));

						case 1:
						case 'end':
							return _context6.stop();
					}
				}
			}, _callee6, this);
		}));

		return function (_x6) {
			return _ref6.apply(this, arguments);
		};
	}();

	User.prototype.generatePasswordHash = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
		var saltRounds;
		return regeneratorRuntime.wrap(function _callee7$(_context7) {
			while (1) {
				switch (_context7.prev = _context7.next) {
					case 0:
						saltRounds = 10;
						_context7.next = 3;
						return _bcrypt2.default.hash(this.password, saltRounds);

					case 3:
						return _context7.abrupt('return', _context7.sent);

					case 4:
					case 'end':
						return _context7.stop();
				}
			}
		}, _callee7, this);
	}));

	User.prototype.validatePassword = function () {
		var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(password) {
			return regeneratorRuntime.wrap(function _callee8$(_context8) {
				while (1) {
					switch (_context8.prev = _context8.next) {
						case 0:
							_context8.next = 2;
							return _bcrypt2.default.compare(password, this.password);

						case 2:
							return _context8.abrupt('return', _context8.sent);

						case 3:
						case 'end':
							return _context8.stop();
					}
				}
			}, _callee8, this);
		}));

		return function (_x7) {
			return _ref8.apply(this, arguments);
		};
	}();

	return User;
};

exports.default = user;