import { UserInputError, AuthenticationError, withFilter } from "apollo-server-express"
import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import pubsub, { EVENTS } from '../subscription'
import relationship from "../models/relationships";
import Sequelize from 'sequelize'
import uuidv4 from 'uuid/v4'
const Op = Sequelize.Op

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
	Query: {
		posts: async (parent, { limit }, { models }) => {
			return await models.Post.findAll()
		},
		post: async (parent, { id }, { models }) => {
			return await models.Post.findById(id, { include: [
				models.User,
			]})
		},


		feed: async (parent, { offset, limit }, { models, me }) => {

			console.log(limit, offset)

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
				],

				order: [
					['createdAt', 'DESC' ]
				]
			})

		}
	},

	Mutation: {

		createPost: combineResolvers(
			isAuthenticated,
			async (parent, { text, media }, { me, models, s3 }) => {
				
				const post = await models.Post.create({
					text,
					userId: me.id
				})
					.then(async (post) => {
						console.log(post.dataValues.id)
						const id = post.dataValues.id
						if (media !== null) {
							console.log(media)
							if (media.length === 1) {
								const { stream, filename, mimetype } = await media[0]

								let spaces_file_url = await storeUpload({ stream, s3, mimetype })
									.then((value) => {
										console.log(value)
										return value
									})
								await models.File.create({
									file_url: spaces_file_url,
									postId: id
								})

								return post
							}	
						}


						return post
					})

				const followers = await models.Relationship.findAll({
					where: { followed_id: me.id },
				})

				let usersArr = await followers.map(user => {
					return user.dataValues.follower_id
				})

				pubsub.publish(EVENTS.POST.CREATED, {
					postAddedToFeed: { 
						post,
						followersToNotify: usersArr
					},
				})

				return post	
			}
		),

	},

	Post: {
		// user: async (post, args, { models }) => {
		// 	return await models.User.findById(post.userId)
		// },

		createdAt: async (post, args, { models }) => {
			return post.createdAt.toString()
		},

		likes: async (post, args, { models }) => {
			return await models.Like.findAndCountAll({
				where: {
					post_id: post.id
				}
			}).then((count) => {
				return count.count
			})
		},

		media: async (post, args, { models }) => {
			return await models.File.findAll({
				where: { postId: post.id }
			})
		}
	},

	Subscription: {
		postAddedToFeed: {
			subscribe: withFilter(
				() => pubsub.asyncIterator(EVENTS.POST.CREATED),
				(payload, variables) => {
					console.log(payload, '||', variables)
					return payload.postAddedToFeed.followersToNotify.includes(variables.feedOwner)
				},
			),
		}
	}
}