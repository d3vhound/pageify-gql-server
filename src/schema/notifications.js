import { gql } from 'apollo-server-express'

export default gql`

	extend type Query {
		notifications: [Notification!]
	}

	extend type Mutation {
		readNotification(id: ID!): Boolean!
	}

	type Notification {
		id: Int!
		text: String!
		initiatorId: Int!
		initiator: User!
		read: Boolean!
		postId: Int!
		post: Post!
	}
`