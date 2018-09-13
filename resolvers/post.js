import { UserInputError, AuthenticationError } from "apollo-server-express";
import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'

export default {
	Query: {
		posts: async (parent, { limit }, { models }) => {
			return await models.Post.findAll()
		},
		post: async (parent, { id }, { models }) => {
			return await models.Post.findById(id)
		}
	},

	Mutation: {

		createPost: combineResolvers(
			isAuthenticated,
			async (parent, { text }, { me, models }) => {	
				return await models.Post.create({
					text,
					userId: me.id
				})
			}
		),

	},

	Post: {
		user: async (post, args, { models }) => {
			return await models.User.findById(post.userId)
		}
	}
}