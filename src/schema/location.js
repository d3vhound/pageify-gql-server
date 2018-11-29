import { gql } from 'apollo-server-express'

export default gql`
	extend type Query {
		locations: [Location]
		location(query: String!): [Location]
	}

	type Location {
		id: ID!
		location: String!
		createdAt: String!
    updatedAt: String!
	}

`