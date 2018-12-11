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
		},
		locationPosts: async (parent, { id }, { me, models }) => {
			const posts = await models.LocationOccurrance.findAll({
				where: {
					locationId: id
				}
			})
			let idsArr = []
			posts.forEach((post) => {
				idsArr.push(post.dataValues.id)
			})
			return await models.Post.findAll({
				where: {
					id: {
						[Op.in]: idsArr
					}
				}
			})
		}
	},

	Mutation: {
		
	},

	Location: {
		users: async(location, {}, { models }) => {
			return await models.User.findAll({
				where: {
					location: {
						[Op.like]: location.location
					}
				}
			})
		}
	}
}