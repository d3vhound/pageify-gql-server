'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var file = function file(sequelize, DataTypes) {
	var File = sequelize.define('file', {
		key: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: true
			}
		}
	});

	File.associate = function (models) {
		File.belongsTo(models.Post);
	};

	return File;
};

exports.default = file;