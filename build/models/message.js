'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var message = function message(sequelize, DataTypes) {
	var Message = sequelize.define('message', {
		text: {
			type: DataTypes.STRING,
			validate: { notEmpty: true }
		}
	});

	Message.associate = function (models) {
		Message.belongsTo(models.User);
	};

	return Message;
};

exports.default = message;