import { gql } from 'apollo-server-express';



export default gql`
	directive @cacheControl(
		maxAge: Int,
		scope: CacheControlScope
	) on OBJECT | FIELD_DEFINITION

	enum CacheControlScope {
		PUBLIC
		PRIVATE
	}
	
	union Results = User | Post

  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
		search(query: String!): [Results]
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

		updateAvatar(file: Upload!): Boolean!

		updateCoverImage(file: Upload!): Boolean!

		updateBio(text: String!): Boolean!

		updateUser(bio: String, name: String, username: String): Boolean!

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
		posts(limit: Int, offset: Int): [Post!]
		posts_count: Int 
		avatar: String
		cover_image: String
		bio: String
    messages: [Message!]
		following: Boolean
		following_count: Int
		followers_count: Int
		followers_array: [ID]
  }

`;