'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var post = function post(sequelize, DataTypes) {
	var Post = sequelize.define('post', {
		text: {
			type: DataTypes.STRING,
			validate: { notEmpty: true }
		},
		media_url: {
			type: DataTypes.JSON
		},
		type: {
			type: DataTypes.STRING
		}
	}, {
		charset: 'utf8mb4'
	});

	Post.associate = function (models) {
		Post.belongsTo(models.User);
		Post.hasMany(models.File);
		Post.belongsToMany(models.User, {
			as: 'likes',
			through: {
				model: models.Like
			},
			foreignKey: 'post_id',
			onDelete: 'cascade',
			hooks: true
		});
	};

	Post.prototype.setLike = function () {
		var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(post) {
			return regeneratorRuntime.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							return _context.abrupt('return', this.addLike(post));

						case 1:
						case 'end':
							return _context.stop();
					}
				}
			}, _callee, this);
		}));

		return function (_x) {
			return _ref.apply(this, arguments);
		};
	}();

	return Post;
};

exports.default = post;