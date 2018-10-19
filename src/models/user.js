import bcrypt from 'bcrypt';

const user = (sequelize, DataTypes) => {
	const User = sequelize.define('user', {
		username: {
			type: DataTypes.STRING,
			unique: {
				args: true,
				msg: 'Username not available.',
			},
			allowNull: false,
			validate: {
				notEmpty: true,
			}
		},
		real_name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		birthday: {
			type: DataTypes.STRING,
		},
		email: {
			type: DataTypes.STRING,
			unique: {
				args: true,
				msg: 'That email has been taken.',
			},
			allowNull: false,
			validate: {
				notEmpty: true,
				isEmail: true
			}
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [7, 42]
			}
		},
		avatar: {
			type: DataTypes.STRING,
		},
		bio: {
			type: DataTypes.STRING,
			validate: {
				len: [0, 120]
			}
		},
		cover_image: {
			type: DataTypes.STRING
		}
	});

	User.associate = models => {
		User.hasMany(models.Message);
		User.hasMany(models.Post);
		User.belongsToMany(models.Post, {
			as: 'likes',
			through: { 
				model: models.Like,
				unique: false
			},
			foreignKey: 'user_id',
			onDelete: 'cascade',
			hooks: true
		})
		User.belongsToMany(User, {
			as: 'following',
			through: models.Relationship,
			foreignKey: 'follower_id',
			onDelete: 'cascade',
			hooks: true
		})
		User.belongsToMany(User, {
			as: 'followers',
			through: models.Relationship,
			foreignKey: 'followed_id',
			onDelete: 'cascade',
			hooks: true
		})
	};

	User.findByLogin = async login => {
		let user = await User.findOne({
			where: { username: login },
		});

		if (!user) {
			user = await User.findOne({
				where: { email: login },
			});
		}

		return user;
	};

	User.beforeCreate(async user => {
		user.password = await user.generatePasswordHash()
	})

	User.prototype.setLike = async function(user) {
		return this.addLike(user)
	}

	User.prototype.follow = async function(user) {
		return this.addFollowing(user)
	}

	User.prototype.unfollow = async function(user) {
		return this.removeFollowing(user)
	}

	User.prototype.following = async function(user) {
		return this.hasFollowing(user)
	}

	User.prototype.generatePasswordHash = async function() {
		const saltRounds = 10;
		return await bcrypt.hash(this.password, saltRounds)
	}

	User.prototype.validatePassword = async function(password) {
		return await bcrypt.compare(password, this.password)
	}

	return User;
};

export default user;