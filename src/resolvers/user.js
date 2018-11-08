import jwt from 'jsonwebtoken'
import { AuthenticationError, UserInputError } from 'apollo-server-express'
import uuidv4 from 'uuid/v4'
import Sequelize from 'sequelize'
const Op = Sequelize.Op
import OneSignal from 'onesignal-node'
import GraphQLJSON from 'graphql-type-json'

var notificationStruct = new OneSignal.Notification({    
	contents: {    
			en: "Test notification",    
			tr: "Test mesajı"    
	}    
})

const createToken = async (user, secret, expiresIn) => {
	const { id, email, username, onesignal_id, admin } = user
	return await jwt.sign({ id, email, username, onesignal_id, admin }, secret)
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
				// console.log(data)
				resolve(data.key)
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
			{ username, email, real_name, location, birthday, password, onesignal_user_id },
			{ models, secret, mixpanel },
		) => {

			try {
				const user = await models.User.create({
					username,
					email,
					real_name,
					location,
					birthday,
					password
				}).then(user => {
					if (onesignal_user_id) {
						models.User.update({
							onesignal_id: onesignal_user_id
						}, {
							where: {
								id: user.dataValues.id
							}
						})

						user.dataValues.onesignal_id = onesignal_user_id
					}

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

				return { token: createToken(user, secret), id: user.dataValues.id }
			}

			catch (error) {
				throw new Error(error)
			}

		},

		signIn: async (
			parent,
			{ login, password, onesignal_user_id },
			{ models, secret },
		) => {
			const user = await models.User.findByLogin(login)
				.then((user) => {
					if (onesignal_user_id) {
						models.User.update({
							onesignal_id: onesignal_user_id
						}, {
							where: {
								id: user.dataValues.id
							}
						})

						user.dataValues.onesignal_id = onesignal_user_id
					}
					return user
				})
				.catch((err) => console.log(err))

			if (!user) {
				throw new UserInputError(
					'No user found with these login credentials'
				)
			}

			// console.log(user)

			const isValid = await user.validatePassword(password)

			if (!isValid) {
				throw new AuthenticationError('Invalid password')
			}

			return { token: createToken(user, secret), id: user.dataValues.id }
		},

		updateAvatar: async (parent, { file }, { models, me, s3 }) => {
			const { stream, filename, mimetype, encoding } = await file

			let file_url = await storeUpload({ stream, s3, mimetype }).then((value) => {
				// console.log('update avatar resolver', value)
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

		updateCoverImage: async (parent, { file }, { models, me, s3 }) => {
			const { stream, filename, mimetype, encoding } = await file

			let file_url = await storeUpload({ stream, s3, mimetype }).then((value) => {
				// console.log('update avatar resolver', value)
				// file_url = value
				return value
			})

			const updateCover = await models.User.update({
				cover_image: file_url
			}, {
					where: {
						id: me.id
					}
				})

			if (updateCover) {
				return true
			}

			return false
		},

		setInterests: async (parent, { payload }, { models, me }) => {
			// if (!me) {
			// 	return new AuthenticationError('Must be signed in to follow users')
			// }

			const createInterests = await models.User.update({
				interests: payload
			}, {
				where: {
					id: me.id
				}
			})

			if (createInterests) {
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

			// console.log('asdasdasd', unfollowSuccess)

			if (unfollowSuccess) {
				return true
			}

			return false

		},

		likePost: async (
			parent,
			{ postId },
			{ models, me, OSClient }
		) => {
			if (!me) {
				return new AuthenticationError('Must be signed in to like posts')
			}

			const current_user = await models.User.findById(me.id)
			const post = await models.Post.findById(postId)
			const postOwner = await models.User.findById(post.dataValues.userId)

			return await current_user.getLikes({
				where: {
					id: postId
				}
			})
				.then(like => {
					if (like[0] === undefined) {
						// console.log('no like found')
						current_user.setLike(post)
						if (postOwner.dataValues.id !== me.id) {
						// console.log(postOwner.dataValues.onesignal_id)
						var NewNotification = new OneSignal.Notification({
							contents: {      
									en: `${current_user.dataValues.real_name} liked your post`,     
							},    
							"ios_badgeType": "Increase",
							"ios_badgeCount": 1,
							include_player_ids: [postOwner.dataValues.onesignal_id],
							filters: [    
								{
									"field": "tag", 
									"key": "userId", 
									"relation": "=", 
									"value": postOwner.dataValues.id
								},  
							],    
						})
						OSClient.sendNotification(NewNotification, (err, httpResponse, data) => {    
							if (err) {    
									// console.log('Something went wrong...');    
							} else {    
									// console.log(data)
									models.Notification.create({
										text: 'Liked your post',
										initiatorId: me.id,
										read: false,
										postId: postId,
										userId: postOwner.dataValues.id
									})    
							}    
						 })
						}

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
		},

		updateUser: async (parent, { username, real_name, location, bio }, { models, me}) => {
 			return await models.User.findOne({
				where: {
					id: me.id
				}
			}).then(async (user) => {
				// console.log(user)
				const userUpdate = await models.User.update({
					username: !username ? user._previousDataValues.username : username,
					real_name: !real_name ? user._previousDataValues.real_name : real_name,
					location: !location ? user._previousDataValues.location : location,
					bio: !bio ? user._previousDataValues.bio : bio,
				}, {
					where: { 
						id: me.id 
					}
				}).then(() => {
					return true
				})

				if (userUpdate) {
					return true
				}
			})
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

		posts: async (user, { limit, offset, comment_id }, { models }) => {
			// console.log('POSTS ARGS', limit, offset)
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

		same_user: async(user, args, { me, models }) => {
			if(!me) {
				return null
			}
			
			if (me.id === user.id) {
				return true
			}

			return false
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

			// console.log(followers)

			const arr = await followers.map(user => {
				return user.dataValues.follower_id
			})

			return await models.User.findAll({
				where: {
					id: {
						[Op.in]: arr
					}
				}
			})
		},

		following_array: async (user, args, { me, models}) => {
			const following = await models.Relationship.findAll({
				where: { follower_id: user.id }
			})

			// console.log(following)

			const arr = await following.map(user => {
				return user.dataValues.followed_id
			})

			return await models.User.findAll({
				where: {
					id: {
						[Op.in]: arr
					}
				}
			})
		},

		interests: async (user, args, { me }) => {
			return GraphQLJSON.parseValue(user.interests)
		}

	},

};