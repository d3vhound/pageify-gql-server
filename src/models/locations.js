const locations = (sequelize, DataTypes) => {
	const Locations = sequelize.define('locations', {
		location: {
			type: DataTypes.STRING,
			validate: { 
				notEmpty: true 
			}
		},
	})

	Locations.associate = models => {
		Locations.belongsToMany(models.Post, {
			as: 'locations',
			through: {
				model: models.LocationOccurrance,
				unique: false
			},
			foreignKey: 'postId',
			onDelete: 'cascade',
			hooks: true,
			constraints: false,
			unique: false
		})
	}

	return Locations
}

export default locations