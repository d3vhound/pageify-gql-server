import { ForbiddenError } from 'apollo-server-express'
import { skip } from 'graphql-resolvers'

export const isAuthenticated = (parent, args, { me }) => 
	me ? skip : new ForbiddenError('Not authenticated as user')

export const isAdmin = (parent, args, { me }) => {
	me.admin ? skip : new ForbiddenError('You are not an admin')
}