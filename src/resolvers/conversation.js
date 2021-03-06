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
		conversation: async (parent, { id, userId, connect, postId }, { me, models, OSClient }) => {
      if (!id && userId) {
        return await models.Conversation.findOrCreate({
          where: {
            senderId: {
              [Op.or]: [me.id, userId]
            },
            receiverId: {
              [Op.or]: [me.id, userId]
            }
          },
          defaults: {
            senderId: me.id,
            receiverId: userId
          }
        }).spread(async (conversation, created) => {
          if (connect && postId) {
            const connectMessage = await models.Message.create({
              text: `${me.username} connected with your post.`,
              userId: me.id,
              conversationId: conversation.dataValues.id,
              _id: uuidv4(),
              postId
            })

            let user1 = conversation.dataValues.senderId
				    let user2 = conversation.dataValues.receiverId
            
            if (user1 !== me.id) {
              // console.log('sending notification to', conversation.dataValues.senderId)
              const userToNotify = await models.User.findByPk(user1)
              var NewNotification = constructNotification({ message: `${me.username}: connected with your post.`, user: userToNotify })
              OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
                if (err) {    
                    console.log('Something went wrong...')    
                } else {    
                    // console.log(data)
                    // const notification = await models.Notification.create({
                    //   text: 'messaged you',
                    //   initiatorId: me.id,
                    //   read: false,
                    //   userId: user1,
                    //   conversationId: conversation.dataValues.id,
                    //   postId: postId,
                    //   messageId: connectMessage.dataValues.id
                    // })  
                    
                    await pubsub.publish(EVENTS.NOTIFICATION.CREATED, {
                      notificationSent: {
                        notification
                      }
                    })
                }    
               })
    
            } else if (user2 !== me.id) {
    
              // console.log('sending notification to', conversation.dataValues.receiverId)
              const userToNotify = await models.User.findByPk(user2)
              var NewNotification = constructNotification({ message: `${me.username}: connected with your post.`, user: userToNotify })
              OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
                if (err) {    
                    console.log('Something went wrong...')    
                } else {    
                    // console.log(data)
                    // const notification = await models.Notification.create({
                    //   text: 'messaged you',
                    //   initiatorId: me.id,
                    //   read: false,
                    //   userId: user2,
                    //   conversationId: conversation.dataValues.id,
                    //   postId: postId,
                    //   messageId: connectMessage.dataValues.id
                    // })
                    
                    await pubsub.publish(EVENTS.NOTIFICATION.CREATED, {
                      notificationSent: {
                        notification
                      }
                    })
                }    
               })
            }
          }

          return conversation
        })
      }

			const convo = await models.Conversation.findById(id)
      
      if (!convo) {
				throw new UserInputError(
					'Conversation does not exist.'
				)
			}

      if (me.id !== convo.dataValues.senderId) {
        // check if me is the receiver
        if (me.id === convo.dataValues.receiverId) {
          console.log('authorized to view convo.')
        } else {
          throw new UserInputError(
            'Not authorized to view conversation'
          )
        }
      } else if (me.id !== convo.dataValues.receiverId) {
        if (me.id === convo.dataValues.senderId) {
          console.log('authorized to view convo.')
        } else {
          throw new UserInputError(
            'Not authorized to view conversation'
          )
        }
      }

			return convo
    },
    
    conversationByUser: async (parent, { userId }, { me, models }) => {
      return await models.Conversation.findOrCreate({
        where: {
          senderId: {
            [Op.or]: [me.id, userId]
          },
          receiverId: {
            [Op.or]: [me.id, userId]
          }
        },
        defaults: {
          senderId: me.id,
          receiverId: userId
        }
      }).spread((conversation, created) => {
        return conversation
      })
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
						return {
              id: conversation.dataValues.id,
              message: 'Conversation already exists'
            }
					}
					return {
            id: conversation.dataValues.id,
            message: 'Successfully created conversation'
          }
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
				const conversation = await models.Conversation.findByPk(Id)


        const conversationSuccess = conversation.destroy({ force: true })
        
        console.log(conversationSuccess)

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
					var NewNotification = constructNotification({ message: `${me.username}: shared a post with you.`, user: userToNotify })
					OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
						if (err) {    
								console.log('Something went wrong...')    
						} else {    
								// console.log(data)
								// const notification = await models.Notification.create({
								// 	text: 'messaged you',
								// 	initiatorId: me.id,
								// 	read: false,
								// 	userId: user1,
                //   conversationId: checkConversation.dataValues.id,
                //   postId: postId,
								// 	messageId: message.dataValues.id
								// })  
								
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
					var NewNotification = constructNotification({ message: `${me.username}: shared a post with you.`, user: userToNotify })
					OSClient.sendNotification(NewNotification, async (err, httpResponse, data) => {    
						if (err) {    
								console.log('Something went wrong...')    
						} else {    
								// console.log(data)
								// const notification = await models.Notification.create({
								// 	text: 'messaged you',
								// 	initiatorId: me.id,
								// 	read: false,
								// 	userId: user2,
                //   conversationId: checkConversation.dataValues.id,
                //   postId: postId,
								// 	messageId: message.dataValues.id
								// })
								
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
    unread_notifications: async (conversation, { limit }, { me, models }) => {
      const real_convo = conversation.dataValues
      const meId = real_convo.senderId === me.id ? real_convo.senderId : real_convo.receiverId
      const otherId = real_convo.senderId === me.id ? real_convo.receiverId : real_convo.senderId

      return await models.Notification.findAll({
        where: {
          conversationId: real_convo.id,
          read: false,
          initiatorId: otherId
        }
      });
    },
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