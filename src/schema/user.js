import { gql } from 'apollo-server-express';



export default gql`
	# directive @cacheControl(
	# 	maxAge: Int,
	# 	scope: CacheControlScope
	# ) on OBJECT | FIELD_DEFINITION

	# enum CacheControlScope {
	# 	PUBLIC
	# 	PRIVATE
	# }
	
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
			real_name: String!
			email: String!
			birthday: String
			location: String
			password: String!
			onesignal_user_id: String
		): Token!

		signIn(login: String!, password: String!, onesignal_user_id: String): Token!

		followUser(userId: ID!): Boolean!
		unfollowUser(userId: ID!): Boolean!

		likePost(postId: ID!): Boolean!

		updateAvatar(file: Upload!): Boolean!

		updateCoverImage(file: Upload!): Boolean!

		updateBio(text: String!): Boolean!

		updateUser(location: String, bio: String, real_name: String, username: String): Boolean!

	}

	type Token {
		token: String!
		id: ID
	}

	type Relationship {
		follower_id: ID!
		followed_id: ID!
	}

  type User @cacheControl(maxAge: 60, scope: PUBLIC) {
    id: ID!
    username: String! 
		email: String!
		admin: Boolean!
		real_name: String!
		location: String
		birthday: String
		same_user: Boolean
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