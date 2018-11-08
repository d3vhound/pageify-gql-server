import "@babel/polyfill"
require('dotenv').config()
import cors from 'cors'
import * as bodyParser from 'body-parser'
import express from 'express'
import http from 'http'
import timber from 'timber'
import jwt from 'jsonwebtoken'
import {
	AuthenticationError
} from 'apollo-server-express'
import {
	ApolloServer,
} from 'apollo-server'
import aws from 'aws-sdk'
import Mixpanel from 'mixpanel'
import morgan from 'morgan'
import DataLoader from 'dataloader'
import OneSignal from 'onesignal-node'
import { ApolloEngine } from 'apollo-engine'

// const transport = new timber.transports.HTTPS(`${process.env.TIMBER_API}`)
// if (process.env.NODE_ENV === 'production') {
// 	timber.install(transport)
// }

aws.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_KEY
})

const OSClient = new OneSignal.Client({
	userAuthKey: process.env.ONESIGNAL_USERAUTH,
	app: {
		appAuthKey: process.env.ONESIGNAL_APPAUTH,
		appId: process.env.ONESIGNAL_APPID
	}
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
// app.use(morgan('combined'))

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
	// console.log(keys)
  const users = await models.User.findAll({
    where: {
      id: {
        $in: keys,
      },
    },
  })
  return keys.map(key => users.find(user => user.id === key))
}

const batchPosts = async (keys, models) => {
	const posts = await models.Post.findAll({
		where: {
			id: {
				$in: keys
			}
		}
	})
	return keys.map(key => posts.find(post => post.id === key))
}

const batchFiles = async (keys, models) => {
	const files = await models.File.findAll({
		where: {
			postId: {
				$in: keys
			}
		}
	})
	return keys.map(key => {
		let filterArr = files.filter(file => file.postId === key)
		return filterArr
	})
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
	cacheControl: {
		defaultMaxAge: 10,
		stripFormattedExtensions: false,
    calculateCacheControlHeaders: true,
	},
	tracing: true,
	engine: {
		apiKey: "service:pageify:_aVxPgfzIbpujP7wMl5_uQ",
	},
	subscriptions: {
		onConnect: () => {
			console.log('Connection')
		}
	},
	formatError: error => {
		console.log(error)
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
			return {
				models
			}
		}

		if (req) {
			const me = await getMe(req);
			console.log(me)
			return {
				models,
				OSClient,
				me,
				mixpanel,
				secret: process.env.SECRET,
				loaders: {
					user: new DataLoader(keys => batchUsers(keys, models)),
					file: new DataLoader(keys => batchFiles(keys, models)),
					likes: new DataLoader(keys => batchLikesCount(keys, models)),
					commentsCount: new DataLoader(keys => batchCommentsCount(keys, models)),
					post: new DataLoader(keys => batchPosts(keys, models))
				},
				s3
			}
		}
	},
	introspection: true,
	playground: true,
	playground: {
		settings: {
			'editor.theme': 'dark',
			"editor.cursorShape": "block",
		},
	},
})

// server.applyMiddleware({ app, path: '/graphql' })

// const httpServer = http.createServer(app)
// server.installSubscriptionHandlers(httpServer)

const eraseDatabaseOnSync = true

sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
	if (eraseDatabaseOnSync) {
		createUsersWithMessages()
	}

	// httpServer.listen({ port: PORT }, () => {
	// 	console.log(`🚀 Server running on localhost:${PORT}${server.graphqlPath}`)
	// })
	server.listen({ port: PORT })
	.then(({ url, subscriptionsUrl }) => {
		console.log(`🚀 Server ready at ${url}`)
  	console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`)
	})
	// engine.listen({
	// 	port: PORT,
	// 	httpServer
	// }, () => {
	// 	console.log(`🚀 Server running on localhost:${PORT}${server.graphqlPath}`)
	// })
})

const createUsersWithMessages = async () => {
	await models.User.create(
		{
			username: 'dvillegas',
			email: 'devion.villegas@ttu.edu',
			password: 'test123',
			real_name: 'Devion Villegas',
			admin: true,
			// messages: [
			// 	{
			// 		text: 'GraphQL is lit',
			// 	},
			// ],
			posts: [
				{
					text: 'Testing',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#2E75F6'
				},
				{
					text: 'Testing2',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#B533F5'
				},
				{
					text: 'Testing3',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#2E75F6'
				},
				{
					text: 'Testing4',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#691B26'
				},
				{
					text: 'Testing5',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#CF2D41'
				},
			]
		},
		{
			include: [models.Message, models.Post],
		},
	);

	await models.User.create(
		{
			username: 'jp',
			email: 'jp@nextgencode.io',
			password: 'test123',
			real_name: 'John Paul',
			private: true,
			// messages: [
			// 	{
			// 		text: 'SQL god'
			// 	},
			// 	{
			// 		text: 'PHP over everything lol',
			// 	},
			// ],
			posts: [
				{
					text: 'Testing',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#B533F5'
				},
				{
					text: 'Testing2',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#691B26'
				},
				{
					text: 'Testing3',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#2E75F6'
				},
				{
					text: 'Testing4',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#CF2D41'
				},
				{
					text: 'Testing5',
					type: 'text',
					category: 'default',
					text_color: '#FFF',
					bg_color: '#2E75F6'
				},
			]
		},
		{
			include: [models.Message, models.Post],
		},
	);
};

