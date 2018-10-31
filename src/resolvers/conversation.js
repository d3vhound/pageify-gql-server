import { UserInputError, AuthenticationError, withFilter } from "apollo-server-express"
import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

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
			return await models.Conversation.findById(id)
		}
	},

	Mutation: {
		createConversation: combineResolvers(
			isAuthenticated,
			async (parent, { receiverId }, { me, models }) => {
				console.log(typeof(me.id))
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
					console.log(err)
					return err
				})
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
				limit
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