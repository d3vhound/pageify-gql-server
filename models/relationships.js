const relationship = (sequelize, DataTypes) => {
	const Relationship = sequelize.define('relationship', {
		follower_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		followed_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		}


	}, {
		freezeTableName: false,
	});

	

	Relationship.associate = models => {
		Relationship.belongsTo(models.User, { as: 'follower', foreignKey: 'follower_id' });
		Relationship.belongsTo(models.User, { as: 'followed', foreignKey: 'followed_id' });
	};

	Relationship.prototype.follow = async function (user) {
		return Relationship.create(this.addFollowing(user))
	}

	return Relationship;
};

export default relationship;