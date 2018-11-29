import { gql } from 'apollo-server-express';

import userSchema from './user';
import messageSchema from './message';
import postSchema from './post'
import fileSchema from './files'
import notificationSchema from './notifications'
import ConversationSchema from './conversation'
import hashtagSchema from './hashtag'
import locationSchema from './location'

const linkSchema = gql`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`;

export default [
	linkSchema, 
	userSchema, 
	messageSchema, 
	postSchema, 
	fileSchema, 
	hashtagSchema,
	notificationSchema,
	ConversationSchema,
	locationSchema
]