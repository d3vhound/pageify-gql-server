import { gql } from 'apollo-server-express';

export default gql`
	extend type Query {
		conversations: [Conversation!]!
	}

	type Conversation {
		id: Int!
		senderId: Int!
		recieverId: Int!
		sender: User!
		reviever: User!
		lastMessage: Message
		messages: [Message!]
	}

	extend type Mutation {
		createConversation(recieverId: Int!): String!
		deleteConversation(Id: ID! senderId: Int recieverId: Int): Boolean!
	}

`