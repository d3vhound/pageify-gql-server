const notification = (sequelize, DataTypes) => {
	const Notification = sequelize.define('notification', {
		text: {
			type: DataTypes.STRING,
			validate: { notEmpty: true }
		},
		initiatorId: {
			type: DataTypes.INTEGER,
		},
		read: {
			type: DataTypes.BOOLEAN
		},
		postId: {
			type: DataTypes.INTEGER,
		} 
	})

	Notification.associate = models => {
		Notification.belongsTo(models.User)
	}

	return Notification
}

export default notification