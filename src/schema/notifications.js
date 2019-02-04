import { gql } from 'apollo-server-express'

export default gql`

	extend type Query {
		notifications(offset: Int, limit: Int): [Notification!]
		unreadMessageCount: Int
		unreadActivityCount: Int
	}

	extend type Mutation {
		readAllNotifications: Boolean
		readNotification(id: ID!): Boolean!
	}

	type Notification {
		id: Int!
		text: String!
		initiatorId: Int!
		initiator: User!
		read: Boolean!
		postId: Int
		post: Post
		createdAt: String!
		follow_request: Boolean!
		conversationId: Int
		messageId: String
    comment_text: String
	}

	extend type Subscription {
		notificationSent(
			receiverId: Int!
		): NotificationSubData
	}

	type NotificationSubData {
		notification: Notification!
	}
`