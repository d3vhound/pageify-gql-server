import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    messages(limit: Int): [Message!]!
    message(id: ID!): Message!
  }

  extend type Mutation {
    createMessage(text: String! conversationId: ID!): Message!
    deleteMessage(id: ID!): Boolean!
  }

  type Message {
		userId: Int!
    id: ID!
    text: String!
    user: User!
		createdAt: String!
		conversationId: Int!
  }

	extend type Subscription {
		messageAdded(conversationId: Int!): MessageAdded!
	}

	type MessageAdded {
		message: Message!
	}

`;