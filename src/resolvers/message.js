import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import uuidv4 from 'uuid/v4'
import Sequelize from 'sequelize'
import pubsub, { EVENTS } from '../subscription'
import { withFilter } from 'apollo-server-express'
import OneSignal from 'onesignal-node'
const Op = Sequelize.Op


const constructNotification = ({ message, user }) => {
	// console.log('get user inside construct func', user, message)
	return new OneSignal.Notification({
		contents: {      
				en: message,     
		},    
		"ios_badgeType": "Increase",
		"ios_badgeCount": 1,
		include_player_ids: [user.dataValues.onesignal_id],
		filters: [    
			{
				"field": "tag", 
				"key": "userId", 
				"relation": "=", 
				"value": user.dataValues.id
			},  
		],    
	})
}

export default {
	Query: {
		messages: async (parent, { limit }, { models }) => {

			if (!limit) {
				return await models.Message.findAll({
					include: [
						models.User,
					]
				})
			}

			return await models.Message.findAll({ limit, include: [
				models.User,
			]})
		},
		message: async (parent, { id }, { models }) => {
			return await models.Message.findById(id);
		},
	},

	Mutation: {
		createMessage: combineResolvers(
			isAuthenticated,
			async (parent, { text, conversationId, _id }, { me, models, OSClient }) => {
				
				const message = await models.Message.create({
					text,
					userId: me.id,
					conversationId,
					_id
				}).then(async message => {
					const user = await models.User.findById(me.id)
					message.user = user
					// console.log(message)
					return message
				})



				// console.log(message._options.includeMap.user)

				const conversation = await models.Conversation.findById(conversationId)

				// console.log(conversation.dataValues)
				let user1 = conversation.dataValues.senderId
				let user2 = conversation.dataValues.receiverId


				if (user1 !== me.id) {

					// console.log('sending notification to', conversation.dataValues.senderId)
					const userToNotify = await models.User.findById(user1)
					var NewNotification = constructNotification({ message: `${me.username}: ${text}`, user: userToNotify })
					OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
						if (err) {    
								console.log('Something went wrong...')    
						} else {    
								// console.log(data)
								const notification = await models.Notification.create({
									text: 'messaged you',
									initiatorId: me.id,
									read: false,
									userId: user1,
									conversationId: conversationId,
									messageId: _id
								})  
								
								await pubsub.publish(EVENTS.NOTIFICATION.CREATED, {
									notificationSent: {
										notification
									}
								})
						}    
					 })

				} else if (user2 !== me.id) {

					// console.log('sending notification to', conversation.dataValues.receiverId)
					const userToNotify = await models.User.findById(user2)
					var NewNotification = constructNotification({ message: `${me.username}: ${text}`, user: userToNotify })
					OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
						if (err) {    
								console.log('Something went wrong...')    
						} else {    
								// console.log(data)
								const notification = await models.Notification.create({
									text: 'messaged you',
									initiatorId: me.id,
									read: false,
									userId: user2,
									conversationId: conversationId,
									messageId: _id
								})
								
								await pubsub.publish(EVENTS.NOTIFICATION.CREATED, {
									notificationSent: {
										notification
									}
								})
						}    
					 })

				}

				
				
				await pubsub.publish(EVENTS.MESSAGE.ADDED, {
					messageAdded: {
						message
					}
				})

				return message

			},
		),

		deleteMessage: async (parent, { id }, { models }) => {
			return await models.Message.destroy({ where: { id } });
		},
	},

	Message: {
		// user: async (message, args, { models, loaders }) => {
		// 	// console.log(message)
		// 	const user1 = await models.User.findById(message.userId);
		// 	// const user2 = await loaders.user.load(message.userId)
		// 	console.log('SEQ', user1)
		// 	// console.log('LOADER', user2)

		// 	return user1
		// },
		post: async (message, args, { models }) => {
			if (!message.postId) {
				return null
			}
			
			return await models.Post.findByPk(message.postId)
		},
		createdAt: async (message, args, { models }) => {
			return message.createdAt.toString()
		},
		notification: async (message, args, { models }) => {
			return await models.Notification.findById({
				where: {
					conversationId: message.conversationId,
					messageId: message._id
				}
			})
		}
	},

	Subscription: {
		messageAdded: {
			subscribe: withFilter(
				() => pubsub.asyncIterator(EVENTS.MESSAGE.ADDED),
				(payload, variables, context) => {
					// console.log('payload', payload)
					// console.log('variables', variables)
					// console.log(context)
					let convoId = parseInt(payload.messageAdded.message.dataValues.conversationId, 10)
					if (variables.conversationId === convoId) {
						return true
					} else {
						console.log('here')
						return false
					}

					// return true
				}
			)
		}
	}
};