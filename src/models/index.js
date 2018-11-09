require('dotenv').config()
import Sequelize from 'sequelize'
const Op = Sequelize.Op

const config = {
	host: process.env.DB_HOST,
	port: 3306,
	dialect: 'mysql',
	pool: {
		max: 100,
		min: 0,
		idle: 10000
	},
	logging: true,
	dialectOptions: {
		charset: 'utf8mb4'
	},
}

if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {
  config.dialectOptions.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
}

const sequelize = new Sequelize(
	process.env.DATABASE,
	process.env.DATABASE_USER,
	process.env.DATABASE_PASSWORD,
	config
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
	Notification: sequelize.import('./notification'),
	Hashtag: sequelize.import('./hashtags'),
	Block: sequelize.import('./blocking'),
	HashtagOccurrance: sequelize.import('./hashtag_occurrance')
}

Object.keys(models).forEach(key => {
	if ('associate' in models[key]) {
		models[key].associate(models)
	}
})

export { sequelize }

export default models