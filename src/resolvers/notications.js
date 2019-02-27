import { UserInputError, AuthenticationError, withFilter } from "apollo-server-express"
import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import pubsub, { EVENTS } from '../subscription'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

export default {
	Query: {
		notifications: combineResolvers(
			isAuthenticated,
			async (parent, { offset, limit }, { me, models }) => {
				return await models.Notification.findAll({
          limit,
          offset,
					where: {
						userId: me.id
					},
					order: [
						['createdAt', 'DESC']
					]
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
          text: {
            [Op.ne]: 'messaged you'
          }
				}
			}).then((obj) => {
				return obj.count
			})
		},
	},

	Mutation: {
		readNotification: async (parent, { id }, { me, models }) => {
			if (!me) {
				return null
			}

			const notification = await models.Notification.findById(id)

			const setRead = await notification.update({
				read: true
			}, {
				hooks: false
			})

			if (setRead) {
				return true
			}

			return false

		},
		readAllNotifications: async (parent, {}, { me, models }) => {
			if (!me) {
				throw new AuthenticationError(
					'Must be signed in',
				)
			}

			const notifications = await models.Notification.findAll({ where: { userId: me.id, read: false }})

			notifications.forEach((item) => {
				item.update({
					read: true
				}, {
					hooks: false
				})
			})
			
			return true

		}
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
	},

	Subscription: {
		notificationSent: {
			subscribe: withFilter(
				() => pubsub.asyncIterator(EVENTS.NOTIFICATION.CREATED),
				(payload, variables) => {
					console.log(payload, '||', variables)
					return payload.notificationSent.notification.dataValues.userId === variables.receiverId
				},
			),
		}
	}

}