import { gql } from 'apollo-server-express';

export default gql`

extend type Query {
	posts: [Post!]
	post(id: ID!): Post
	feed(offset: Int, limit: Int): [Post!]
	trendingposts(limit: Int!, category: String): [Post!]
	foryouposts(limit: Int!, category: String): [Post!]
	recentposts(limit: Int!, category: String): [Post!]
	topposts(limit: Int!, category: String): [Post!]
}

extend type Mutation {
	createPost(
		text: String!
		media: [Upload]
		type: String
		category: String
		bg_color: String
		text_color: String
	): Post!

	deletePost(
		id: ID!
	): Boolean!

	createComment(
		postId: ID!
		text: String!
	): Boolean!

	deleteComment(
		postId: ID!
	): Boolean!
}

type Post @cacheControl(maxAge: 60) {
	id: ID!
	user: User!
	text: String!
	media: [File2]
	likes: Int
	interactions: Int!
	comments: [Comment]
	createdAt: String!
	liked: Boolean
	category: String
	type: String
	bg_color: String
	text_color: String
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