import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

export default {
	Query: {
		hashtags: async (parent, { id }, { me, models }) => {
			return await models.Hashtag.findAll()
		},
		hashtag: async (parent, { query }, { me, models }) => {
			return await models.Hashtag.findAll({
				limit: 20,
				where: {
					hashtag: {
						[Op.like]: `%${query}%`
					}
				}
			})
		}
	},

	Mutation: {
		
	},

	Hashtags: {
		posts_count: async (hashtag, {}, { models }) => {
			const tags = await models.HashtagOccurrance.findAndCountAll({
				where: {
					hashtagId: hashtag.id
				}
			})
			return tags.count
		},
		post: async (hashtag, {}, { models }) => {
			const postId = await models.HashtagOccurrance.findOne({
				where: {
					hashtagId: hashtag.id
				}
			})
			return await models.Post.findOne({
				where: {
					id: postId.dataValues.postId
				}
			})
		}
	}
}