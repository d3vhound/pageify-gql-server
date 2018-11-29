const locationOccurred = (sequelize, DataTypes) => {
	const LocationOccurred = sequelize.define('location_occurrance', {
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
		locationId: {
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
			{ fields: ['postId', 'locationId'], unique: false }
		]
	})

	LocationOccurred.associate = models => {
		LocationOccurred.belongsTo(models.Locations, { as: 'location_map', foreignKey: 'locationId', constraints: false })
	}

	return LocationOccurred
}

export default locationOccurred