import uuid from 'uuid/v4'

const issue = (sequelize, DataTypes) => {
	const Issue = sequelize.define('issue', {
		text: {
			type: DataTypes.STRING,
			validate: { notEmpty: true }
		},
	}, {
		charset: 'utf8mb4',
	})

	Issue.associate = models => {
		Issue.belongsTo(models.User)
	}

	return Issue
}

export default issue