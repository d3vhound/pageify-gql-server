import { gql } from 'apollo-server-express';

export default gql`

extend type Query {
	posts: [Post!]
	post(id: ID!): Post
	feed(offset: Int, limit: Int): [Post!]
	trendingposts(locationId: ID hashtagId: ID limit: Int!, interests: [String] category: String): [Post!]
	foryouposts(limit: Int!, category: String): [Post!]
	recentposts(locationId: ID hashtagId: ID limit: Int!, category: String): [Post!]
	topposts(locationId: ID hashtagId: ID limit: Int!, category: String): [Post!]
	spotlight(limit: Int offset: Int): [Post!]
}

extend type Mutation {
	createPost(
		text: String!
		media: [Upload]
		type: String
		category: String
		bg_color: String
		text_color: String
		location: String
	): Post!

	deletePost(
		id: ID!
	): Boolean!

	spotlightPost(
		id: ID!
	): Boolean!

	removeSpotlightPost(
		id: ID!
	): Boolean!

	createComment(
		postId: ID!
		text: String!
	): Boolean!

	deleteComment(
		postId: ID!
	): Boolean!

	reportPost(
		postId: ID!
		spam: Boolean
		guidelines: Boolean
	): Boolean!
}

type Post @cacheControl(maxAge: 60, scope: PUBLIC) {
	id: ID!
	user: User!
	text: String!
	spotlight: Boolean!
	media: [File2]
	likes: Int
	interactions: Int!
	comments: [Comment]
	createdAt: String!
	liked: Boolean
	category: String
	users_liked: [User]
	type: String
	bg_color: String
	text_color: String
	location: String
	hashtags: [Hashtags]
}

type Comment {
	user: User!
	post: Post!
	text: String!
	createdAt: String!
	id: ID!
}

type File2 {
	filename: String
  mimetype: String
  encoding: String
	key: String
}

extend type Subscription {
	postCreated: PostCreated!
	postAddedToFeed(
		feedOwner: Int!
	): PostCreated!
}

type PostCreated {
	post: Post!
	followersToNotify: [ID!]
}


`