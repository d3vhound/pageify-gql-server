const file = (sequelize, DataTypes) => {
	const File = sequelize.define('file', {
		key: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: true
			}
		},
	})

	File.associate = models => {
		File.belongsTo(models.Post)
	}

	return File
}

export default file