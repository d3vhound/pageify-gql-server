import uuid from 'uuid/v4'

const message = (sequelize, DataTypes) => {
	const Message = sequelize.define('message', {
		_id: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.UUID,
			validate: { notEmpty: true }
		},
		text: {
			type: DataTypes.STRING,
			validate: { notEmpty: true }
		},
		postId: {
			type: DataTypes.INTEGER,
		}
	}, {
		charset: 'utf8mb4',
	})

	Message.associate = models => {
		Message.belongsTo(models.Conversation)
		Message.belongsTo(models.User)
		Message.belongsTo(models.Post)
	}

	return Message
}

export default message