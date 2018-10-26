import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'

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
		)
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
		}
	}

}