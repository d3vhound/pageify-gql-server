import { PubSub } from 'apollo-server'
import * as POST_EVENTS from './post'
import * as CONVO_EVENTS from './conversation'
import * as MESSAGE_EVENTS from './message'
import * as NOTIFICATION_EVENTS from './notifications'

export const EVENTS = {
	POST: POST_EVENTS,
	CONVERSATION: CONVO_EVENTS,
	MESSAGE: MESSAGE_EVENTS,
	NOTIFICATION: NOTIFICATION_EVENTS
}

export default new PubSub()