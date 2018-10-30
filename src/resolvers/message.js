import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import uuidv4 from 'uuid/v4'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

export default {
	Query: {
		messages: async (parent, { limit }, { models }) => {

			if (!limit) {
				return await models.Message.findAll();
			}

			return await models.Message.findAll({ limit });
		},
		message: async (parent, { id }, { models }) => {
			return await models.Message.findById(id);
		},
	},

	Mutation: {
		createMessage: combineResolvers(
			isAuthenticated,
			async (parent, { text, conversationId }, { me, models }) => {
				
					return await models.Message.create({
						text,
						userId: me.id,
						conversationId
					})
					.then(message => {
						console.log(message)
						return message
					})
			},
		),

		deleteMessage: async (parent, { id }, { models }) => {
			return await models.Message.destroy({ where: { id } });
		},
	},

	Message: {
		user: async (message, args, { models, loaders }) => {
			// return await models.User.findById(message.userId);
			return await loaders.user.load(message.userId)
		},
		createdAt: async (message, args, { models }) => {
			return message.createdAt.toString()
		}
	},
};