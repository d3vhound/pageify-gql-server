'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var relationship = function relationship(sequelize, DataTypes) {
	var Relationship = sequelize.define('relationship', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		follower_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		followed_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		}

	}, {
		freezeTableName: false
	});

	Relationship.associate = function (models) {
		Relationship.belongsTo(models.User, { as: 'follower', foreignKey: 'follower_id' });
		Relationship.belongsTo(models.User, { as: 'followed', foreignKey: 'followed_id' });
	};

	Relationship.prototype.follow = function () {
		var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(user) {
			return regeneratorRuntime.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							return _context.abrupt('return', Relationship.create(this.addFollowing(user)));

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

	return Relationship;
};

exports.default = relationship;