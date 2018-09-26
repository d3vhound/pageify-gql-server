import { UserInputError, AuthenticationError } from "apollo-server-express";
import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
import relationship from "../models/relationships";
import Sequelize from 'sequelize'
const Op = Sequelize.Op

export default {
	Query: {
		posts: async (parent, { limit }, { models }) => {
			return await models.Post.findAll()
		},
		post: async (parent, { id }, { models }) => {
			return await models.Post.findById(id)
		},


		feed: async (parent, { offset, limit }, { models, me }) => {

			console.log(limit, offset)

			const users = await models.Relationship.findAll({
				where: { follower_id: me.id },
			})

			let usersArr = await users.map(user => {
				return user.dataValues.followed_id
			})

			usersArr.push(me.id)

			return await models.Post.findAll({
				limit,
				offset,
				where: { 
					userId: {
						[Op.or]: usersArr
					} 
				},

				include: [{
					model: models.User
				}],

				order: [
					['createdAt', 'DESC' ]
				]
			})

		}
	},

	Mutation: {

		createPost: combineResolvers(
			isAuthenticated,
			async (parent, { text, file }, { me, models, s3 }) => {	
				return await models.Post.create({
					text,
					userId: me.id
				})
			}
		),

	},

	Post: {
		// user: async (post, args, { models }) => {
		// 	return await models.User.findById(post.userId)
		// },

		createdAt: async (post, args, { models }) => {
			return JSON.stringify(post.createdAt)
		}
	}
}