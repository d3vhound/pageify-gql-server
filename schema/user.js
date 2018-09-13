import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }

	extend type Mutation {
		signUp(
			username: String!
			email: String!
			password: String!
		): Token!

		signIn(login: String!, password: String!): Token!

		followUser(userId: ID!): Boolean!
		unfollowUser(userId: ID!): Boolean!

		likePost(postId: ID!): Boolean!
	}

	type Token {
		token: String!
	}

	type Relationship {
		follower_id: ID!
		followed_id: ID!
	}

  type User {
    id: ID!
    username: String!
		email: String!
		posts: [Post!]
    messages: [Message!]
		following: Boolean
		following_count: Int
		followers_count: Int
  }

`;