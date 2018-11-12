const reports = (sequelize, DataTypes) => {
	const Reports = sequelize.define('reports', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		spam: {
			type: DataTypes.BOOLEAN,
		},
		guidelines: {
			type: DataTypes.BOOLEAN,
		}
	})

	Reports.associate = models => {
		Reports.belongsTo(models.User, { as: "reporting"})
		Reports.belongsTo(models.User, { as: "reported"})
		Reports.belongsTo(models.Post)
	}

	return Reports
}

export default reports