const replies = (sequelize, DataTypes) => {
	const Replies = sequelize.define('replies', {
		text: {
			type: DataTypes.STRING,
			validate: { 
				notEmpty: true 
			}
		},
	});

	Replies.associate = models => {
		Replies.belongsTo(models.User)
		Replies.belongsTo(models.Comment)
	}

	return Replies
}

export default replies