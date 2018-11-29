import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

export default {
	Query: {
		locations: async (parent, { id }, { me, models }) => {
			return await models.Locations.findAll()
		},
		location: async (parent, { query }, { me, models }) => {
			return await models.Locations.findAll({
				limit: 20,
				where: {
					location: {
						[Op.like]: `%${query}%`
					}
				}
			})
		}
	},

	Mutation: {
		
	},

}