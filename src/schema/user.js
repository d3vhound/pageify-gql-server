import { gql } from 'apollo-server-express'



export default gql`
	# directive @cacheControl(
	# 	maxAge: Int,
	# 	scope: CacheControlScope
	# ) on OBJECT | FIELD_DEFINITION

	# enum CacheControlScope {
	# 	PUBLIC
	# 	PRIVATE
	# }

	scalar JSON
	
	union Results = User | Post | Hashtags

  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
		search(query: String!): [Results]
		block_list: [User]
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

		sendFollowRequest(userId: ID!): SuccessMessage!
		handleFollowRequest(approve: Boolean!): SuccessMessage!

		likePost(postId: ID!): Boolean!

		updateAvatar(file: Upload!): Boolean!

		updateCoverImage(file: Upload!): Boolean!

		updateBio(text: String!): Boolean!

		updatePassword(oldPassword: String! newPassword: String!): Boolean!

		reportUser(userId: ID!): Boolean!

		updateUser(
			location: String, 
			bio: String, 
			real_name: String, 
			username: String,
			private_status: Boolean
		): Boolean!

		setInterests(payload: JSON): Boolean!

		incrementViewCount(userId: ID!): Boolean!

		blockUser(
			userId: ID!
		): Boolean!

		unblockUser(
			userId: ID!
		): Boolean!

	}

	type Token {
		token: String!
		id: ID
	}

	type SuccessMessage {
		success: Boolean!
		message: String!
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
		private_status: Boolean!
		real_name: String!
		location: String
		birthday: String
		same_user: Boolean
		posts(limit: Int, offset: Int): [Post!]
		posts_count: Int 
		avatar: String
		cover_image: String
		bio: String
		views: Int
		blocked: Boolean
		blocking: Boolean
    messages: [Message!]
		following: Boolean
		following_count: Int
		followers_count: Int
		followers_array: [User]
		following_array: [User]
		interests: JSON
  }

`;