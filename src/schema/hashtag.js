import { gql } from 'apollo-server-express'

export default gql`
	extend type Query {
		hashtags: [Hashtags]
		hashtag(query: String!): [Hashtags]
		hashtagPosts(id: ID!): [Post]
	}

	type Hashtags {
		id: ID!
		hashtag: String!
		createdAt: String!
    updatedAt: String!
		posts_count: Int!
		post: Post!
	}

`