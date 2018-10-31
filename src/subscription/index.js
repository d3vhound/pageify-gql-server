import { PubSub } from 'apollo-server'
import * as POST_EVENTS from './post'
import * as CONVO_EVENTS from './conversation'
import * as MESSAGE_EVENTS from './message'

export const EVENTS = {
	POST: POST_EVENTS,
	CONVERSATION: CONVO_EVENTS,
	MESSAGE: MESSAGE_EVENTS
}

export default new PubSub()