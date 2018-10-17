import jwt from 'jsonwebtoken'
import { AuthenticationError, UserInputError } from 'apollo-server-express'
import uuidv4 from 'uuid/v4'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

const createToken = async (user, secret, expiresIn) => {
	const { id, email, username } = user
	return await jwt.sign({ id, email, username }, secret)
}

const storeUpload = ({ stream, mimetype, s3 }) =>
	new Promise((resolve, reject) => {
		const uuidFilename = uuidv4()

		const params = {
			Bucket: 'pageify',
			Body: stream,
			Key: uuidFilename,
			ContentType: mimetype,
			ACL: 'public-read'
		}


		s3.upload(params, (err, data) => {
			if (err) {
				return console.error('Error', err)
			}

			if (data) {
				console.log(data)
				resolve(data.Location)
			}
		})

		stream.on('end', () => console.log('end'))
		stream.on('error', reject)
	})

export default {
	Results: {
    __resolveType(obj, context, info){
      if(obj.username){
        return 'User'
      }

      if(obj.text){
        return 'Post'
      }

      return null;
    },
	},

	Query: {
		users: async (parent, args, { models }) => {
			return await models.User.findAll({ include: [models.Message,] });
		},
		user: async (parent, { id }, { models }) => {
			console.log('jere')
			return await models.User.findById(id, { include: [models.Message,] });
		},
		me: async (parent, args, { models, me }) => {
			if (!me) {
				throw new AuthenticationError(
					'Missing token. Please sign in again. stack-trace: [/resolvers/user]',
				);
			}

			return await models.User.findById(me.id, { include: [models.Message] })
		},
		search: async (parent, { query }, { models, me}) => {
			const Users =  await models.User.findAll({
				limit: 20,
				where: {
					username: {
						[Op.like]: `%${query}%`
					}
				},
			})

			const Posts = await models.Post.findAll({
				where: {
					text: {
						[Op.like]: `%${query}%`
					}
				}
			})
			
			const Results = Users.concat(Posts)

			return Results
		}
	},

	Mutation: {
		signUp: async (
			parent,
			{ username, email, password },
			{ models, secret, mixpanel },
		) => {

			try {
				const user = await models.User.create({
					username,
					email,
					password
				}).then(user => {
					mixpanel.track('Created account', {
						distinct_id: user.dataValues.id,
						time: new Date()
					})

					mixpanel.people.set(user.dataValues.id, {
						$name: user.dataValues.username,
						$email: user.dataValues.email,
						$created: (new Date()).toISOString(),
					})
					
					return user
				})

				return { token: createToken(user, secret) }
			}

			catch (error) {
				throw new Error(error)
			}

		},

		signIn: async (
			parent,
			{ login, password },
			{ models, secret },
		) => {
			const user = await models.User.findByLogin(login)

			if (!user) {
				throw new UserInputError(
					'No user found with these login credentials'
				)
			}

			const isValid = await user.validatePassword(password)

			if (!isValid) {
				throw new AuthenticationError('Invalid password')
			}

			return { token: createToken(user, secret) }
		},

		updateAvatar: async (parent, { file }, { models, me, s3 }) => {
			const { stream, filename, mimetype, encoding } = await file

			let file_url = await storeUpload({ stream, s3, mimetype }).then((value) => {
				console.log('update avatar resolver', value)
				// file_url = value
				return value
			})

			const updateAvi = await models.User.update({
				avatar: file_url
			}, {
					where: {
						id: me.id
					}
				})

			if (updateAvi) {
				return true
			}

			return false
		},

		followUser: async (
			parent,
			{ userId },
			{ models, me }
		) => {

			if (!me) {
				return new AuthenticationError('Must be signed in to follow users')
			}

			const current_user = await models.User.findById(me.id)
			const other_user = await models.User.findById(userId)


			if (current_user.id === other_user.id) {
				return new UserInputError(`Can't follow yourself bud.`)
			}

			const alreadyFollowing = await current_user.following(other_user)
			const followSuccess = await current_user.follow(other_user)


			if (alreadyFollowing) {
				return new UserInputError('Already following this user')
			}

			else if (followSuccess) {
				return true
			}

			return false

		},

		unfollowUser: async (
			parent,
			{ userId },
			{ models, me }
		) => {

			if (!me) {
				return new AuthenticationError('Must be signed in to unfollow users')
			}

			const current_user = await models.User.findById(me.id)
			const other_user = await models.User.findById(userId)

			const unfollowSuccess = await current_user.unfollow(other_user)

			console.log('asdasdasd', unfollowSuccess)

			if (unfollowSuccess) {
				return true
			}

			return false

		},

		likePost: async (
			parent,
			{ postId },
			{ models, me }
		) => {
			if (!me) {
				return new AuthenticationError('Must be signed in to like posts')
			}

			const current_user = await models.User.findById(me.id)
			const post = await models.Post.findById(postId)

			return await current_user.getLikes({
				where: {
					id: postId
				}
			})
				.then(like => {
					if (like[0] === undefined) {
						console.log('no like found')
						current_user.setLike(post)
						return true
					} else {
						// console.log(like[0])
						current_user.removeLike(post)
						return false
					}
				})


			// const postLikeSuccess = await current_user.setLike(post)

			// console.log('--------------------')
			// console.log(postLikeSuccess)
			// console.log('--------------------')

			// if (postLikeSuccess) {
			// 	return true
			// }

			// return false
		}
	},

	User: {

		// messages: async (user, args, { models }) => {
		// 	return await models.Message.findAll({
		// 		where: {
		// 			userId: user.id,
		// 		},
		// 	});
		// },

		posts: async (user, { limit, offset }, { models }) => {
			console.log('POSTS ARGS', limit, offset)
			return await models.Post.findAll({
				limit,
				offset,
				where: {
					userId: user.id,
				},
				order: [
					['createdAt', 'DESC']
				]
			});
		},

		posts_count: async (user, args, { models }) => {
			return await models.Post.findAndCountAll({
				where: {
					userId: user.id
				}
			}).then(result => {
				return result.count
			})
		},

		following: async (user, args, { me, models }) => {
			if (!me) {
				return null
			}

			const current_user = await models.User.findById(me.id)
			const other_user = await models.User.findById(user.id)

			return await current_user.following(other_user)
		},

		followers_count: async (user, args, { me, models }) => {
			return await models.Relationship.findAndCountAll({
				where: {
					followed_id: user.id
				}
			})
				.then(result => {
					return result.count
				})
		},

		following_count: async (user, args, { me, models }) => {
			return await models.Relationship.findAndCountAll({
				where: {
					follower_id: user.id
				}
			})
				.then(result => {
					return result.count
				})
		},

		followers_array: async (user, args, { me, models }) => {
			const followers = await models.Relationship.findAll({
				where: { followed_id: user.id },
			})

			const arr = await followers.map(user => {
				return user.dataValues.follower_id
			})

			return arr
		}

	},

};