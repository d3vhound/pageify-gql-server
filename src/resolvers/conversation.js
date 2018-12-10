import { UserInputError, AuthenticationError, withFilter } from "apollo-server-express"
import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import Sequelize from 'sequelize'
import pubsub, { EVENTS } from '../subscription'
import uuidv4 from 'uuid/v4'
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
		conversations: combineResolvers(
			isAuthenticated,
			async (parent, { id }, { me, models }) => {
				return await models.Conversation.findAll({
					where: {
						[Op.or]: [
							{
								senderId: me.id
							},
							{
								receiverId: me.id
							}
						]
					}
				})
			}
		),
		conversation: async (parent, { id }, { me, models }) => {
			const convo = await models.Conversation.findById(id)

			if (!convo) {
				throw new UserInputError(
					'Conversation does not exist anymore'
				)
			}

			return convo
		}
	},

	Mutation: {
		createConversation: combineResolvers(
			isAuthenticated,
			async (parent, { receiverId }, { me, models }) => {
				// console.log(typeof(me.id))
				if (receiverId === me.id) {
					throw new UserInputError(
						'can not message yourself'
					)
				}
				return await models.Conversation.findOrCreate({
					where: {
						senderId: {
							[Op.or]: [me.id, receiverId]
						},
						receiverId: {
							[Op.or]: [me.id, receiverId]
						}
					},
					defaults: {
						senderId: me.id,
						receiverId,
					}
				})
				.spread((conversation, created) => {
					if (!created) {
						return 'Conversation already exists'
					}
					return 'Successfully created conversation'
				})
				.catch(err => {
					// console.log(err)
					return err
				})
			}
		),
		deleteConversation: combineResolvers(
			isAuthenticated,
			async (parent, { Id, senderId, receiverId }, { me, models }) => {
				const conversationSuccess = await models.Conversation.destroy({
					where: {
						id: Id,
						senderId,
						receiverId
					}
				})

				if (conversationSuccess) {
					return true
				}

				return false
			}
		),
		sharePost: combineResolvers(
			isAuthenticated,
			async (parent, { receiverId, postId }, { me, models, OSClient }) => {
				const checkConversation = await models.Conversation.findOrCreate({
					where: {
						senderId: {
							[Op.or]: [me.id, receiverId]
						},
						receiverId: {
							[Op.or]: [me.id, receiverId]
						}
					},
					defaults: {
						senderId: me.id,
						receiverId,
					}
				})
				.spread((conversation, created) => {
					if (!created) {
						return conversation
					}
					return conversation
				})
				.catch(err => {
					console.log(err)
					return false
				})

				if (!checkConversation) {
					return false
				}

				const message = await models.Message.create({
					text: `${me.username} shared a post`,
					userId: me.id,
					conversationId: checkConversation.dataValues.id,
					_id: uuidv4(),
					postId
				}).then(async message => {
					const user = await models.User.findById(me.id)
					message.user = user
					// console.log(message)
					return message
				})

				let user1 = checkConversation.dataValues.senderId
				let user2 = checkConversation.dataValues.receiverId

				
				
				if (user1 !== me.id) {
					// console.log('sending notification to', conversation.dataValues.senderId)
					const userToNotify = await models.User.findById(user1)
					var NewNotification = constructNotification({ message: `${me.username}:  Shared a post with you.`, user: userToNotify })
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
					var NewNotification = constructNotification({ message: `${me.username}: Shared a post with you.`, user: userToNotify })
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

				return true

			}
		)
	},

	Conversation: {
		messages: async (conversation, { limit }, { models }) => {
			return await models.Message.findAll({
				where: {
					conversationId: conversation.id
				},
				order: [[ 'createdAt', 'DESC' ]],
				limit,
				include: [
					models.User,
				]
			})
		},
		sender: async (conversation, args, { models }) => {
			return await models.User.findById(conversation.senderId)
		},
		receiver: async (conversation, args, { models }) => {
			return await models.User.findById(conversation.receiverId)
		},
		meId: async (conversation, args, { me, models }) => {
			return me.id
		}
	}
	
}