import { gql } from 'apollo-server-express';

export default gql`
	extend type Query {
		conversations: [Conversation!]!
	}

	type Conversation {
		id: Int!
		senderId: Int!
		receiverId: Int!
		sender: User!
		receiver: User!
		lastMessage: Message
		messages: [Message!]
	}

	extend type Mutation {
		createConversation(receiverId: Int!): String!
		deleteConversation(Id: ID! senderId: Int receiverId: Int): Boolean!
	}

`