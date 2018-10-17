import { gql } from 'apollo-server-express';

export default gql`

extend type Query {
	posts: [Post!]
	post(id: ID!): Post
	feed(offset: Int, limit: Int): [Post!]
}

extend type Mutation {
	createPost(
		text: String!
		media: [Upload]
		type: String
	): Post!

	deletePost(
		id: ID!
	): Boolean!
}

type Post {
	id: ID!
	user: User!
	text: String!
	media: [File2]
	likes: Int
	replies: [Post]
	createdAt: String!
	liked: Boolean
	type: String
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