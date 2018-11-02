require('dotenv').config()
import Sequelize from 'sequelize';

const sequelize = new Sequelize(
	process.env.DATABASE,
	process.env.DATABASE_USER,
	process.env.DATABASE_PASSWORD,
	{
		host: process.env.DB_HOST,
		port: 3306,
		dialect: 'mysql',
		pool: {
			max: 100,
			min: 0,
			idle: 10000
		},
		dialectOptions: {
			charset: 'utf8mb4'
		},
	},
);

const models = {
	User: sequelize.import('./user'),
	File: sequelize.import('./files'),
	Message: sequelize.import('./message'),
	Conversation: sequelize.import('./conversation'),
	Replies: sequelize.import('./replies'),
	Comment: sequelize.import('./comments'),
	Relationship: sequelize.import('./relationships'),
	Post: sequelize.import('./post'),
	Like: sequelize.import('./likes'),
	Notification: sequelize.import('./notification')
}

Object.keys(models).forEach(key => {
	if ('associate' in models[key]) {
		models[key].associate(models)
	}
});

export { sequelize }

export default models;