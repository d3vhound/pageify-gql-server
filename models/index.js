require('dotenv').config()
import Sequelize from 'sequelize';

const sequelize = new Sequelize(
	process.env.DATABASE,
	process.env.DATABASE_USER,
	process.env.DATABASE_PASSWORD,
	{
		host: 'localhost',
		port: 3306,
		dialect: 'mysql',
		dialectOptions: {
			charset: 'utf8mb4'
		},
	},
);

const models = {
	User: sequelize.import('./user'),
	Message: sequelize.import('./message'),
	Relationship: sequelize.import('./relationships'),
	Post: sequelize.import('./post'),
	Like: sequelize.import('./likes'),
};

Object.keys(models).forEach(key => {
	if ('associate' in models[key]) {
		models[key].associate(models);
	}
});

export { sequelize };

export default models;