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

}