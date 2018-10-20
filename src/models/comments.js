const comment = (sequelize, DataTypes) => {
	const Comment = sequelize.define('comment', {
		text: {
			type: DataTypes.STRING,
			validate: { 
				notEmpty: true 
			}
		},
	});

	Comment.associate = models => {
		Comment.belongsTo(models.User)
		Comment.hasMany(models.Replies)
	}

	return Comment
}

export default comment;