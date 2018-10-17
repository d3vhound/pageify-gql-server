'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.sequelize = undefined;

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('dotenv').config();


var sequelize = new _sequelize2.default(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
	host: 'localhost',
	port: 3306,
	dialect: 'mysql',
	dialectOptions: {
		charset: 'utf8mb4'
	}
});

var models = {
	User: sequelize.import('./user'),
	File: sequelize.import('./files'),
	Message: sequelize.import('./message'),
	Relationship: sequelize.import('./relationships'),
	Post: sequelize.import('./post'),
	Like: sequelize.import('./likes')
};

Object.keys(models).forEach(function (key) {
	if ('associate' in models[key]) {
		models[key].associate(models);
	}
});

exports.sequelize = sequelize;
exports.default = models;