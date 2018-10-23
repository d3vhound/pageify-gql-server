const post = (sequelize, DataTypes) => {
	const Post = sequelize.define('post', {
		text: {
			type: DataTypes.STRING,
			validate: { notEmpty: true },
		},
		media_url: {
			type: DataTypes.JSON
		},
		type: {
			type: DataTypes.STRING,
		},
		category: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		}
	}, {
		charset: 'utf8mb4',
	})

	Post.associate = models => {
		Post.belongsTo(models.User)
		Post.hasMany(models.File)
		Post.hasMany(models.Comment)
		Post.belongsToMany(models.User, {
			as: 'likes',
			through: {
				model: models.Like,
			},
			foreignKey: 'post_id',
			onDelete: 'cascade',
			hooks: true
		})
	}

	Post.prototype.setLike = async function (post) {
		return this.addLike(post)
	}

	return Post
}

export default post