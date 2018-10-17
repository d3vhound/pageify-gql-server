'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var like = function like(sequelize, DataTypes) {
	var Like = sequelize.define('like', {

		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		post_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: false,
			constraints: false,
			validate: {
				notEmpty: true
			}
		},

		user_id: {
			type: DataTypes.INTEGER,
			primaryKey: false,
			unique: false,
			constraints: false,
			validate: {
				notEmpty: true
			}
		}
	}, {
		indexes: [{ fields: ['post_id', 'user_id'], unique: false }]
	});

	Like.associate = function (models) {
		Like.belongsTo(models.Post, { as: 'liked', foreignKey: 'post_id', constraints: false });
		Like.belongsTo(models.User, { as: 'like', foreignKey: 'user_id', constraints: false });
	};

	return Like;
};

exports.default = like;