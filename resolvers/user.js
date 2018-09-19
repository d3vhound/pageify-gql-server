import jwt from 'jsonwebtoken'
import { AuthenticationError, UserInputError } from 'apollo-server-express'

const createToken = async (user, secret, expiresIn) => {
	const { id, email, username } = user
	return await jwt.sign({ id, email, username }, secret)
}

export default {
	Query: {
		users: async (parent, args, { models }) => {
			return await models.User.findAll({ include: [ models.Message, models.Post ]});
		},
		user: async (parent, { id }, { models }) => {
			console.log('jere')
			return await models.User.findById(id, { include: [models.Message] });
		},
		me: async (parent, args, { models, me }) => {
			if (!me) {
				throw new AuthenticationError(
					'Missing token. Please sign in again. stack-trace: [/resolvers/user]',
				);
			}

			return await models.User.findById(me.id, { include: [models.Message, models.Post] })
		},
	},
	
	Mutation: {
		signUp: async (
			parent,
			{ username, email, password },
			{ models, secret },
		) => {

			try {
				const user = await models.User.create({
					username,
					email,
					password
				})

				return { token: createToken(user, secret) }
			}

			catch (error) {
				throw new Error(error.errors[0].message)
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


			const postLikeSuccess = await current_user.setLike(post)

			console.log('--------------------')
			console.log(postLikeSuccess)
			console.log('--------------------')

			if (postLikeSuccess) {
				return true
			}

			return false
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


			
	},
	
};