const block = (sequelize, DataTypes) => {
	const Block = sequelize.define('block', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		blocker_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: false,
			constraints: false,
			validate: {
				notEmpty: true
			}
		},
		blocked_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: false,
			constraints: false,
			validate: {
				notEmpty: true
			}
		}


	}, {
		freezeTableName: false,
		indexes: [
			{ fields: ['blocker_id', 'blocked_id'], unique: false }
		]
	})

	Block.associate = models => {
		Block.belongsTo(models.User, { as: 'blocker', foreignKey: 'blocker_id', constraints: false })
		Block.belongsTo(models.User, { as: 'blocked', foreignKey: 'blocked_id', constraints: false })
	}

	// Block.prototype.follow = async function (user) {
	// 	return Block.create(this.addFollowing(user))
	// }

	return Block;
}

export default block