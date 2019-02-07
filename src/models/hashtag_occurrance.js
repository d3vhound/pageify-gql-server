const hashtagOccurred = (sequelize, DataTypes) => {
	const HashtagOccurred = sequelize.define('hashtag_occurrance', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		postId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: false,
			constraints: false, 
			validate: {
				notEmpty: true
			}
		},
		hashtagId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: false,
			constraints: false, 
			validate: {
				notEmpty: true
			}
		},
	}, 
	{
		timestamps: false,
		indexes: [
			{ fields: ['postId', 'hashtagId'], unique: false }
		]
	})

	HashtagOccurred.associate = models => {
		HashtagOccurred.belongsTo(models.Hashtag, { as: 'hashtag_map', foreignKey: 'hashtagId', constraints: false, onDelete: 'cascade' })
	}

	return HashtagOccurred
}

export default hashtagOccurred