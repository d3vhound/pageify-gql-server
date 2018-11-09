import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

export default {
	Query: {
		notifications: combineResolvers(
			isAuthenticated,
			async (parent, { id }, { me, models }) => {
				return await models.Notification.findAll({
					where: {
						userId: me.id
					}
				})
			}
		),
		unreadMessageCount: async (parent, {}, { me, models }) => {
			if (!me) {
				return null
			}
			return await models.Notification.findAndCountAll({
				where: {
					userId: me.id,
					read: false,
					text: "messaged you"
				}
			}).then((obj) => {
				return obj.count
			})
		},
		unreadActivityCount: async (parent, {}, { me, models }) => {
			if (!me) {
				return null
			}
			return await models.Notification.findAndCountAll({
				where: {
					userId: me.id,
					read: false,
				}
			}).then((obj) => {
				return obj.count
			})
		}
	},

	Mutation: {
		
	},

	Notification: {
		post: async (notification, { }, { models, loaders }) => {
			if (notification.postId) {
				return await loaders.post.load(notification.postId)
			}
			return null
		},
		initiator: async (notification, { }, { models, loaders }) => {
			if (notification.initiatorId) {
				return await loaders.user.load(notification.initiatorId)
			}
			return null
		},
		createdAt: async (notification, { }, { models }) => {
			return notification.createdAt.toString()
		}
	}

}