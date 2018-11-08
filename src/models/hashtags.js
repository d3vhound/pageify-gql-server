const hashtags = (sequelize, DataTypes) => {
	const Hashtags = sequelize.define('hashtags', {
		hashtag: {
			type: DataTypes.STRING,
			validate: { 
				notEmpty: true 
			}
		},
	})

	Hashtags.associate = models => {
		Hashtags.belongsToMany(models.Post, {
			as: 'hashtags',
			through: {
				model: models.HashtagOccurrance,
				unique: false
			},
			foreignKey: 'postId',
			onDelete: 'cascade',
			hooks: true,
			constraints: false,
			unique: false
		})
	}

	return Hashtags
}

export default hashtags