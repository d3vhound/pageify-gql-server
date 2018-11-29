const post = (sequelize, DataTypes) => {
	const Post = sequelize.define('post', {
		text: {
			type: DataTypes.TEXT,
			validate: { notEmpty: true },
		},
		type: {
			type: DataTypes.STRING,
		},
		bg_color: {
			type: DataTypes.STRING,
		},
		text_color: {
			type: DataTypes.STRING,
		},
		spotlight: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		location: {
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
		paranoid: true,
		timestamps: true
	})

	Post.associate = models => {
		Post.belongsTo(models.User, {
			onDelete: 'cascade'
		})
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