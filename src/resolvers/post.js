import { UserInputError, AuthenticationError, withFilter } from "apollo-server-express"
import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import pubsub, { EVENTS } from '../subscription'
import relationship from "../models/relationships";
import Sequelize from 'sequelize'
import uuidv4 from 'uuid/v4'
const Op = Sequelize.Op
import OneSignal from 'onesignal-node'
import hashtagRegex from 'hashtag-regex'

const regex = hashtagRegex()

const allCategories = [
	"entertainment",
	"music",
	"dance",
	"beauty",
	"sports",
	"design",
	"gaming",
	"food & drink",
	"fashion",
	"photography",
	"all"
]

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
				// file_url: data.Location,data.key)
			}
		})

		stream.on('end', () => console.log('end'))
		stream.on('error', reject)
	})

export default {
	Query: {
		posts: async (parent, { limit }, { models }) => {
			return await models.Post.findAll({
				include: [
					models.User,
					models.Comment
				]
			}).then(post => {
				// console.log(post)
				return post
			})
		},
		post: async (parent, { id }, { models }) => {
			return await models.Post.findById(id, {
				include: [
					models.User,
				]
			})
		},
		foryouposts: async (parent, { limit }, { models }) => {
			return await models.Post.findAll({
				
			})
		},
		spotlight: async (parent, { limit, offset }, { models }) => {
			return await models.Post.findAll({
				limit,
				offset,
				where: {
					spotlight: true
				},
				include: [
					{
						model: models.User,
					},
					{
						model: models.File
					}
				],
			})
		},
		recentposts: async (parent, { limit, category }, { models }) => {
			return await models.Post.findAll({
				where: {
					category: {
						[Op.or]: category !== undefined ? [category] : ['entertainment', 'music', 'dance', 'beauty', 'sports', 'design','gaming', 'food drink', 'fashion', 'photography', 'all', 'default']
					}
				},
				order: [
					['createdAt', 'DESC']
				],
				include: [
					{
						model: models.User,
						where: {
							private_status: false,
							banned: false
						}
					}
				],
				limit,
			})
		},
		topposts: async (parent, { limit, category }, { models }) => {
			return await models.Post.findAll({
				where: {
					category: {
						[Op.or]: category !== undefined ? [category] : ['entertainment', 'music', 'dance', 'beauty', 'sports', 'design','gaming', 'food drink', 'fashion', 'photography', 'all', 'default']
					}
				},
				attributes: [
					'id',
					'text',
					'type',
					'userId',
					'text_color',
					'bg_color',
					[Sequelize.literal('(SELECT count(*) FROM posts AS P INNER JOIN likes AS L ON L.post_id = P.id WHERE P.id = post.id)'),'likes'],
					[Sequelize.literal('(SELECT count(*) FROM posts AS P INNER JOIN comments AS C ON C.postId = P.id WHERE P.id = post.id)'),'comments'],
					[Sequelize.literal('(SELECT count(*) FROM posts AS P INNER JOIN likes AS L ON L.post_id = P.id WHERE P.id = post.id) + (SELECT count(*) FROM posts AS P INNER JOIN comments AS C ON C.postId = P.id WHERE P.id = post.id)'), 'interactions']
				],
				include: [
					{
						model: models.User,
						where: {
							private_status: false,
							banned: false
						}
					}
				],
				order: [
					[Sequelize.literal('interactions'), 'DESC']
				],
				limit,
			})
		},
		trendingposts: async (parent, { category, limit }, { models }) => {
			console.log(category)
			return await models.Post.findAll({
				where: {
					createdAt: {
						[Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000)
					},
					category: {
						[Op.or]: category !== undefined ? [category] : ['entertainment', 'music', 'dance', 'beauty', 'sports', 'design','gaming', 'food drink', 'fashion', 'photography', 'all', 'default']
					}
				},
				attributes: [
					'id',
					'text',
					'type',
					'userId',
					'text_color',
					'category',
					'bg_color',
					[Sequelize.literal('(SELECT count(*) FROM posts AS P INNER JOIN likes AS L ON L.post_id = P.id WHERE P.id = post.id)'),'likes'],
					[Sequelize.literal('(SELECT count(*) FROM posts AS P INNER JOIN comments AS C ON C.postId = P.id WHERE P.id = post.id)'),'comments'],
					[Sequelize.literal('(SELECT count(*) FROM posts AS P INNER JOIN likes AS L ON L.post_id = P.id WHERE P.id = post.id) + (SELECT count(*) FROM posts AS P INNER JOIN comments AS C ON C.postId = P.id WHERE P.id = post.id)'), 'interactions']
				],
				include: [
					{
						model: models.User,
						where: {
							private_status: false,
							banned: false
						}
					}
				],
				order: [
					[Sequelize.literal('interactions'), 'DESC']
				],
				limit,
			})
		},

		feed: async (parent, { offset, limit }, { models, me }, { cacheControl }) => {
			cacheControl.setCacheHint({ maxAge: 60 })

			const users = await models.Relationship.findAll({
				where: { follower_id: me.id },
			})
			let usersArr = await users.map(user => {
				return user.dataValues.followed_id
			})
			usersArr.push(me.id)
			return await models.Post.findAll({
				limit,
				offset,
				where: {
					userId: {
						[Op.or]: usersArr
					}
				},
				include: [
					{
						model: models.User,
					},
					{
						model: models.File
					}
				],
				order: [
					['createdAt', 'DESC']
				]
			})
		}
	},

	Mutation: {

		createPost: combineResolvers(
			isAuthenticated,
			async (parent, { text, media, type, category, bg_color, text_color, location }, { me, models, s3, mixpanel }) => {
				
				if (!type) {
					type = 'Default'
				}

				if (!category) {
					category = 'default'
				}

				// if (media === null || undefined) {
				// 	throw new UserInputError(
				// 		'Please try again'
				// 	)
				// }

				if (type === 'single_image' && media === null) { 
					throw new UserInputError(
						'Please try again'
					)
				}

				if (type === 'multi_images' && media === null) { 
					throw new UserInputError(
						'Please try again'
					)
				}

				// console.log('><><><><><><><><><><><')
				// console.log('expanse000', media)
				// console.log('><><><><><><><><><><><')

				
				// await mixpanel.track('Created post', {
				// 	distinct_id: me.id,
				// 	media: media !== undefined ? true : false,
				// 	text: text,
				// 	type: type,
				// 	time: new Date()
				// })

				const post = await models.Post.create({
					text,
					userId: me.id,
					type,
					category,
					bg_color,
					text_color,
					location
				})
					.then(async (post) => {
						// console.log(post.dataValues.id)
						const id = post.dataValues.id

						if (media !== null && media !== undefined) {
							// console.log(media)
							if (media.length === 1) {
								const { stream, filename, mimetype } = await media[0]
								await storeUpload({ stream, s3, mimetype })
									.then(async (value) => {
										// console.log(value)
										await models.File.create({
											key: value,
											postId: id
										})
									})
									.catch(err => console.log(err))
							} 
							if (media.length > 1) {
								await media.forEach(async file => {
									const { stream, filename, mimetype } = await file
									// console.log(">>>>>>>>>>>>>", stream, filename, mimetype)
									await storeUpload({ stream, s3, mimetype })
									.then(async (value) => {
										// console.log(value)
										await models.File.create({
											key: value,
											postId: id
										})
									})
									.catch(err => console.log(err))
								})
							}
						}

						const postText = post.dataValues.text
						// let foundHashtags = postText.match(/#[a-zA-Z0-9_]+/g)
						let match;
						let hashtags = []
						while (match = regex.exec(postText)) {
							const hashtag = match[0]
							hashtags.push(hashtag)
							// console.log(`Matched sequence ${ hashtag } — code points: ${ [...hashtag].length }`)
						}

						// console.log(hashtags)

						let uniqueHashtags = [...new Set(hashtags)]

						console.log(uniqueHashtags)

						uniqueHashtags.forEach(async (tag) => {
							await models.Hashtag.findOrCreate({ where: { hashtag: tag }})
							.spread(async (hashtag, created) => {
								let tagObj = hashtag.get({ plain: true })
								await models.HashtagOccurrance.create({
									hashtagId: tagObj.id,
									postId: id
								})
							})
						})

						await models.Locations.findOrCreate({ where: { location }})
							.spread(async (location, created) => {
								let locationObj = location.get({ plain: true })
								console.log(locationObj)
								await models.LocationOccurrance.create({
									locationId: locationObj.id,
									postId: id
								})
							})

						// let foundHashtags = regex.exec(postText)
						// console.log(foundHashtags)
						
						return post
					})

				// const followers = await models.Relationship.findAll({
				// 	where: { followed_id: me.id },
				// })

				// let usersArr = await followers.map(user => {
				// 	return user.dataValues.follower_id
				// })

				// pubsub.publish(EVENTS.POST.CREATED, {
				// 	postAddedToFeed: {
				// 		post,
				// 		followersToNotify: usersArr
				// 	},
				// })

				return post
			}
		),

		createComment: combineResolvers(
			isAuthenticated,
			async (parent, { postId, text }, { me, models, s3, mixpanel, OSClient }) => {
				const addComment = await models.Comment.create({
					text: text,
					postId: postId,
					userId: me.id
				})

				const postOwnerId = await models.Post.findById(postId)
					.then((obj) => {
						console.log(obj.dataValues.userId)
						return obj.dataValues.userId
					})

				if (postOwnerId !== me.id) {

				const postOwnerUser = await models.User.findById(postOwnerId)

				const notification = await models.Notification.create({
					text: 'Commented on your post',
					initiatorId: me.id,
					read: false,
					postId: postId,
					userId: postOwnerUser.dataValues.id
				})

				await pubsub.publish(EVENTS.NOTIFICATION.CREATED, {
					notificationSent: {
						notification
					}
				})
				
				var NewNotification = new OneSignal.Notification({
					contents: {      
							en: `${postOwnerUser.dataValues.real_name} commented on your post`,     
					},    
					"ios_badgeType": "Increase",
					"ios_badgeCount": 1,
					include_player_ids: [postOwnerUser.dataValues.onesignal_id],
					filters: [    
						{
							"field": "tag", 
							"key": "userId", 
							"relation": "=", 
							"value": postOwnerUser.dataValues.id
						},
						{
							"field": "tag", 
							"key": "mentions", 
							"relation": "=", 
							"value": "enabled"
						},   
					],    
				})

				OSClient.sendNotification(NewNotification, (err, httpResponse, data) => {    
					if (err) {    
							console.log('Something went wrong...', err);    
					} else {    
							// console.log(data)
							// const notification = models.Notification.create({
							// 	text: 'Commented on your post',
							// 	initiatorId: me.id,
							// 	read: false,
							// 	postId: postId,
							// 	userId: postOwnerUser.dataValues.id
							// })    

					}    
				 })

				} 
				
				 if (addComment) {
					return true
				}

				return false
				
				// console.log(addComment)
			}),

			spotlightPost: async (parent, { id}, { me, models}) => {
				if (me.admin === true) {
					const post_spotlight = await models.Post.findById(id)
						.then((post) => {
							post.update({ spotlight: true })
							return post
						})

					if (post_spotlight) {
						return true
					}

					return false
				}

				throw new UserInputError(
					'You must be an admin to do this'
				)
			},

			removeSpotlightPost: async (parent, { id}, { me, models}) => {
				if (me.admin === true) {
					const post_spotlight = await models.Post.findById(id)
						.then((post) => {
							post.update({ spotlight: false })
							return post
						})

					if (post_spotlight) {
						return true
					}

					return false
				}

				throw new UserInputError(
					'You must be an admin to do this'
				)
			},
		
			deletePost: combineResolvers(
				isAuthenticated,
				async (parent, { id }, { me, models }) => {
					const isOwner = await models.Post.findOne({ where: { id, userId: me.id }})
					// console.log(isOwner)
					if (isOwner) {
						const deletedPost = await isOwner.destroy()
						if (deletedPost) {
							return true
						}
						return false
					} 

					if (me.admin === true) {
						const post = await models.Post.findOne({ where: { id }})
						if (post) {
							const deletedPost = post.destroy()
							if (deletedPost) {
								return true
							}
							return  false
						}
						return false
					}

					return false
				}
			),


			reportPost: async (parent, { postId, spam, guidelines }, { me, models }) => {
				const report = await models.Report.create({
					reportingId: me.id,
					postId: postId,
					spam,
					guidelines
				})

				if (report) {
					return true
				}

				return false
			}

	},

	Post: {
		// user: async (post, args, { models, loaders }) => {
		// 	// return await models.User.findById(post.userId)
		// 	return await loaders.user.load(post.userId)
		// },
		users_liked: async (post, args, { models }) => {
			const users_that_liked = await models.Like.findAll({
				where: {
					post_id: post.id
				}
			}).then((obj) => {
				let arr = obj.map((ids) => {
					return ids.dataValues.user_id
				})
				return arr
			})

			return await models.User.findAll({
				where: {
					id: {
						$in: users_that_liked
					}
				}
			})
		},

		hashtags: async (post, args, { models, loaders }) => {
			const hashtags = await loaders.hashtags.load(post.id)
			let ids = []
			hashtags.forEach((tag) => {
				ids.push(tag.dataValues.hashtagId)
			})
			if (ids.length < 1) {
				return []
			}
			return await models.Hashtag.findAll({
				where: {
					id: {
						[Op.in]: ids
					}
				}
			})
		},

		createdAt: async (post, args, { models }) => {
			return post.createdAt.toString()
		},

		interactions: async (post, args, { models, loaders }) => {
			// const likesCount = await models.Like.count({
			// 	where: {
			// 		post_id: post.id
			// 	}
			// })

			const likesCount2 = await loaders.likes.load(post.id)
			// console.log(post.id, likesCount2)

			// const commentCount = await models.Comment.count({
			// 	where: {
			// 		postId: post.id
			// 	}
			// })

			const commentCount2 = await loaders.commentsCount.load(post.id)

			// console.log(post.id, commentCount2)

			return likesCount2 + commentCount2
		},

		comments: async (post, args, { models }) => {
			return await models.Comment.findAll({
				where: {
					postId: post.id
				},
				order: [
					['createdAt', 'DESC']
				]
			})
		},

		likes: async (post, args, { models, loaders }) => {
			return await loaders.likes.load(post.id)
		},

		media: async (post, args, { models, loaders }) => {
			// return await models.File.findAll({
			// 	where: { postId: post.id }
			// })
			return await loaders.file.load(post.id)
		},

		liked: async (post, args, { models, me }) => {
			if (!me) {
				return null
			}

			const likedStatus = await models.Like.findOne({
				where: {
					post_id: post.id,
					user_id: me.id
				}
			})

			if (likedStatus === null) {
				return false
			}


			return true

		}
	},

	Comment: {
		user: async (comment, args, { models, me, loaders }) => {
			// return await models.User.findOne({
			// 	where: {
			// 		id: comment.userId
			// 	}
			// })
			return await loaders.user.load(comment.userId)
		},
		createdAt: async (comment, args, { models }) => {
			return comment.createdAt.toString()
		},
		post: async (comment, args, { models, me}) => {
			// console.log(comment, args)
			return null
		}
	},

	Subscription: {
		postCreated: {
			subscribe: () => pubsub.asyncIterator(EVENTS.POST.CREATED)
		},
		postAddedToFeed: {
			subscribe: withFilter(
				() => pubsub.asyncIterator(EVENTS.POST.CREATED),
				(payload, variables) => {
					// console.log(payload, '||', variables)
					return payload.postAddedToFeed.followersToNotify.includes(variables.feedOwner)
				},
			),
		}
	}
}