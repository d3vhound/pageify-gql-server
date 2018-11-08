import userResolvers from './user';
import messageResolvers from './message';
import postResolvers from './post'
import fileResolvers from './files'
import notificationResolvers from './notications'
import conversationResolvers from './conversation'
import hashtagResolvers from './hashtag'

export default [
	userResolvers, 
	messageResolvers, 
	postResolvers, 
	fileResolvers, 
	notificationResolvers,
	conversationResolvers,
	hashtagResolvers
]