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
		Reports.belongsTo(models.User)
		Reports.belongsTo(models.Post)
	}

	return Reports
}

export default reports