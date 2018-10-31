import { gql } from 'apollo-server-express';

export default gql`
	extend type Query {
		conversations: [Conversation!]!
		conversation(id: ID!): Conversation!
	}

	type Conversation {
		id: Int!
		senderId: Int!
		receiverId: Int!
		sender: User!
		receiver: User!
		lastMessage: Message
		messages(limit: Int): [Message!]
		meId: Int!
	}

	extend type Mutation {
		createConversation(receiverId: Int!): String!
		deleteConversation(Id: ID! senderId: Int receiverId: Int): Boolean!
	}

`