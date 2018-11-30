import jwt from 'jsonwebtoken'
import { AuthenticationError, UserInputError } from 'apollo-server-express'
import pubsub, { EVENTS } from '../subscription'
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
      if (obj.username){
        return 'User'
      }

      if (obj.text) {
        return 'Post'
			}
			
			if (obj.hashtag) {
				return 'Hashtags'
			}

			if (obj.location) {
				return 'Location'
			}

      return null;
    },
	},

	Query: {
		users: async (parent, args, { models }) => {
			return await models.User.findAll({ include: [models.Message,] });
		},
		user: async (parent, { id }, { models }) => {
			let user_queried = models.User.findById(id).then((user) => {
				user.update({ views: user.views + 1}, { hooks: false })

				return user
			})
			// let updated_views_user = await user_queried.update({ views: user_queried.views + 1 }, { hooks: false })
			return await user_queried
		},
		me: async (parent, args, { models, me }) => {
			if (!me) {
				throw new AuthenticationError(
					'Missing token. Please sign in again. stack-trace: [/resolvers/user]',
				);
			}

			return await models.User.findById(me.id, { include: [models.Message] })
		},
		block_list: async (parent, args, { models, me }) => {
			if (!me) {
				throw new AuthenticationError(
					'Must be signed in',
				)
			}

			const blocked_ids = await models.Block.findAll({
				where: {
					blocker_id: me.id
				}
			}).then((obj) => {
				let arr = obj.map((id) => {
					return id.dataValues.blocked_id
				})
				return arr
			})

			return await models.User.findAll({
				where: {
					id: {
						$in: blocked_ids
					}
				}
			})
		},
		search: async (parent, { query }, { models, me}) => {

			// query.replace('@', '')
			// query.replace('#', '')

			const Users =  await models.User.findAll({
				limit: 20,
				where: {
					username: {
						[Op.like]: `%${query}%`
					}
				},
			})

			const Posts = await models.Post.findAll({
				limit: 20,
				where: {
					text: {
						[Op.like]: `%${query}%`
					}
				}
			})

			const Hashtags = await models.Hashtag.findAll({
				limit: 20,
				where: {
					hashtag: {
						[Op.like]: `%${query}%`
					}
				}
			})

			const Locations = await models.Locations.findAll({
				limit: 20,
				where: {
					location: {
						[Op.like]: `%${query}%`
					}
				}
			})
			
			const Results = [...Users, ...Hashtags, ...Posts, ...Locations]

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
					},
					hooks: false
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
					},
					hooks: false
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
			{ models, me, OSClient }
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
				
				var NewNotification = new OneSignal.Notification({
					contents: {      
							en: `${current_user.dataValues.real_name} started following you`,     
					},    
					"ios_badgeType": "Increase",
					"ios_badgeCount": 1,
					include_player_ids: [other_user.dataValues.onesignal_id],
					filters: [    
						{
							"field": "tag", 
							"key": "userId", 
							"relation": "=", 
							"value": other_user.id
						},
						{
							"field": "tag", 
							"key": "mentions", 
							"relation": "=", 
							"value": "enabled"
						},   
					],    
				})

				OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
					if (err) {    
							// console.log('Something went wrong...');    
					} else {    
							// console.log(data)
							const notification = await models.Notification.create({
								text: 'followed you',
								initiatorId: me.id,
								read: false,
								userId: other_user.dataValues.id
							})
							
							await pubsub.publish(EVENTS.NOTIFICATION.CREATED, {
								notificationSent: {
									notification
								}
							})
					}    
				 })

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

		incrementViewCount: async (parent, { userId }, { models, me}) => {
			const user_to_update = await models.User.findById(userId)
			const success = await user_to_update.update({
				views: user_to_update._previousDataValues.views + 1
			}, {
				hooks: false
			})
			if (success) {
				return true
			}
			return false
		},

		blockUser: async (parent, { userId }, { models, me}) => {
			if (!me) {
				return new AuthenticationError('You must be signed in')
			}

			const current_user = await models.User.findById(me.id)
			const other_user = await models.User.findById(userId)

			const blockSuccess = await other_user.setBlocking(current_user)
			await current_user.unfollow(other_user)
			await other_user.unfollow(current_user)
			

			if (blockSuccess) {
				return true
			}

			return false
		},

		unblockUser: async (parent, { userId }, { models, me}) => {
			if (!me) {
				return new AuthenticationError('You must be signed in')
			}

			const current_user = await models.User.findById(me.id)
			const other_user = await models.User.findById(userId)

			const unblockSuccess = await current_user.removeBlocked(other_user)

			console.log(unblockSuccess)

			if (unblockSuccess) {
				return true
			}

			return false
		},

		reportUser: async (parent, { userId }, { me, models }) => {
			const report = await models.Report.create({
				reportingId: me.id,
				reportedId: userId
			})

			if (report) {
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
								{
									"field": "tag", 
									"key": "likes", 
									"relation": "=", 
									"value": "enabled"
								},   
							],    
						})
						OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
							if (err) {    
									// console.log('Something went wrong...');    
							} else {    
									// console.log(data)
									const notification = await models.Notification.create({
										text: 'Liked your post',
										initiatorId: me.id,
										read: false,
										postId: postId,
										userId: postOwner.dataValues.id
									})
									
									await pubsub.publish(EVENTS.NOTIFICATION.CREATED, {
										notificationSent: {
											notification
										}
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

		updateUser: async (parent, { username, real_name, location, bio, private_status }, { models, me}) => {
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
					private_status: private_status === undefined ? user._previousDataValues.private_status : private_status
				}, {
					where: { 
						id: me.id 
					},
					hooks: false
				}).then(() => {
					return true
				})

				if (userUpdate) {
					return true
				}
			})
		},

		updatePassword: async(parent, { oldPassword, newPassword }, { models, me}) => {
			if (!me) {
				return new AuthenticationError('Must be signed in')
			}

			const current_user = await models.User.findById(me.id)

			const checkOldPassword = await current_user.validatePassword(oldPassword)

			console.log(checkOldPassword)

			if (!checkOldPassword) {
				throw new AuthenticationError('Invalid password')
			}

			// newPassword = await current_user.generatePasswordHash()

			// console.log(newPassword)

			const updateSuccess = current_user.update({
				password: newPassword
			}, {
				where: {
					id: me.id
				}
			})

			if (!updateSuccess) {
				return false
			}

			return true
		},

		forgotPassword: async (parent, { email }, { models, me, sgMail}) => {
			// if (!me) {
			// 	return new AuthenticationError('Must be signed in')
			// }
	
			const doesEmailExist = await models.User.findOne({ where: { email }})
	
			if (!doesEmailExist) {
				return false
			}

			await doesEmailExist.update({
				password: "reset123"
			})

			const msg = {
				to: email,
				from: 'help@pageifyapp.com',
				subject: 'Password Reset',
				text: 'We have successfully process your password reset request. Please use the temporary password "reset123" to login and change your temporary password to a more secure and memorable password. \n Pageify App Team',
				html: `<h3>Password Reset Request</h3><p>Hello, ${doesEmailExist.dataValues.username}, <br /> Your password has been reset to <u>"reset123"</u>. <p>If you did not request this password reset please email us at help@pageifyapp.com .</p><p>Pageify App Team</p>`
			}

			await sgMail.send(msg)
			
			return true
		},

		reportIssue: async (parent, { text }, { models, me }) => {
			if (!me) {
				return new AuthenticationError('Must be signed in')
			}
			const issueSuccess = await models.Issue.create({
				text: text,
				userId: me.id
			})

			if (!issueSuccess) {
				return false
			}

			return true
		},
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

		blocked: async (user, args, { me, models}) => {
			if (!me) {
				return null
			}

			const current_user = await models.User.findById(me.id)
			const other_user = await models.User.findById(user.id)

			return other_user.hasBlocked(current_user)
		},

		blocking: async (user, args, { me, models}) => {
			if (!me) {
				return null
			}

			const current_user = await models.User.findById(me.id)
			const other_user = await models.User.findById(user.id)

			return other_user.hasBlocking(current_user)
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