import { gql } from 'apollo-server-express';

export default gql`

extend type Query {
	posts: [Post!]
	post(id: ID!): Post
	userFeed: [Post!]
}

extend type Mutation {
	createPost(
		text: String!
		media: [Upload]
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
}

type File2 {
	filename: String!
  mimetype: String!
  encoding: String!
}


`