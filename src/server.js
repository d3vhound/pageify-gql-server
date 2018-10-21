import "@babel/polyfill"
require('dotenv').config()
import cors from 'cors'
import * as bodyParser from 'body-parser'
import express from 'express'
import http from 'http'
import timber from 'timber'
import jwt from 'jsonwebtoken'
import {
	ApolloServer,
	AuthenticationError
} from 'apollo-server-express'
import aws from 'aws-sdk'
import Mixpanel from 'mixpanel'
import morgan from 'morgan'
import DataLoader from 'dataloader'


const transport = new timber.transports.HTTPS(`${process.env.TIMBER_API}`)
if (process.env.NODE_ENV === 'production') {
	timber.install(transport)
}

aws.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_KEY
})

const spacesEndpoint = new aws.Endpoint(process.env.SPACE_ENDPOINT)

const s3 = new aws.S3({
	endpoint: spacesEndpoint
})

let mixpanel = Mixpanel.init('cf9c61b9e7ac9e9d8b06f8b91c0023b4')

import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';

const PORT = process.env.PORT || 9000

const app = express()

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(cors())
app.use(morgan('combined'))

const getMe = async req => {
	const token = req.headers['x-token']

	if (token) {
		try {
			return await jwt.verify(token, process.env.SECRET)
		} catch (error) {
			throw new AuthenticationError(
				'Your session has expired. Please sign in again.'
			)
		}
	}
}

const batchUsers = async (keys, models) => {
  const users = await models.User.findAll({
    where: {
      id: {
        $in: keys,
      },
    },
  })
  return keys.map(key => users.find(user => user.id === key))
}

const batchLikesCount = async (keys, models) => {
	const likes = await models.Like.findAll({
		where: {
			post_id: {
				$in: keys
			}
		}
	})
	return keys.map(key => {
		let filterArr = likes.filter(like => like.post_id === key)
		return filterArr.length
	})
}

const batchCommentsCount = async (keys, models) => {
	const comments = await models.Comment.findAll({
		where: {
			postId: {
				$in: keys
			}
		}
	})
	return keys.map(key => {
		let filterArr = comments.filter(comment => comment.postId === key)
		return filterArr.length
	})
}

const server = new ApolloServer({
	typeDefs: schema,
	resolvers,
	engine: {
		apiKey: "service:d3vhound-pageify090418:IJ9a3TLVbX3q8TUJ_AfWhw"
	},
	formatError: error => {
    // remove the internal sequelize error message
    // leave only the important validation error
    const message = error.message
			.replace('SequelizeValidationError: ', '')
			.replace('SequelizeUniqueConstraintError: ', '')
      .replace('Validation error: ', '')

    return {
      ...error,
      message,
    }
	},
	context: async ({ req, connection }) => {
		if (connection) {
			console.log('connection')
			return {
				models
			}
		}

		if (req) {
			const me = await getMe(req);
			console.log('--------------')
			console.log('me user >', me)
			console.log('--------------')

			return {
				models,
				me,
				mixpanel,
				secret: process.env.SECRET,
				loaders: {
					user: new DataLoader(keys => batchUsers(keys, models)),
					likes: new DataLoader(keys => batchLikesCount(keys, models)),
					commentsCount: new DataLoader(keys => batchCommentsCount(keys, models))
				},
				s3
			}
		}
	},
	subscriptions: {
    onConnect: (connectionParams, webSocket, context) => {
      console.log('New client ws connection')
    },
    onDisconnect: (webSocket, context) => {
      console.log('client ws disconnected')
    },
  },
	introspection: true,
	playground: true,
	tracing: true,
	playground: {
		settings: {
			'editor.theme': 'dark',
			"editor.cursorShape": "block",
		},
	},
})

server.applyMiddleware({ app, path: '/graphql' })

const httpServer = http.createServer(app)
server.installSubscriptionHandlers(httpServer)

const eraseDatabaseOnSync = true

sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
	if (eraseDatabaseOnSync) {
		createUsersWithMessages()
	}

	httpServer.listen({ port: PORT }, () => {
		console.log(`🚀 Server running on localhost:${PORT}${server.graphqlPath}`)
	})
})

const createUsersWithMessages = async () => {
	await models.User.create(
		{
			username: 'dvillegas',
			email: 'devion.villegas@ttu.edu',
			password: 'test123',
			real_name: 'Devion Villegas',
			messages: [
				{
					text: 'GraphQL is lit',
				},
			],
		},
		{
			include: [models.Message]
		},
	);

	await models.User.create(
		{
			username: 'jp',
			email: 'jp@nextgencode.io',
			password: 'test123',
			real_name: 'John Paul',
			messages: [
				{
					text: 'SQL god'
				},
				{
					text: 'PHP over everything lol',
				},
			],
		},
		{
			include: [models.Message]
		}
	);
};

