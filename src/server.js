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

let mixpanel = Mixpanel.init('32c2b2c06b54826c4f2d0006c665b533')

import schema from '../schema';
import resolvers from '../resolvers';
import models, { sequelize } from '../models';

const PORT = process.env.PORT || 9000

const app = express()

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(cors())

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

const server = new ApolloServer({
	typeDefs: schema,
	resolvers,
	engine: {
		apiKey: "service:d3vhound-pageify090418:IJ9a3TLVbX3q8TUJ_AfWhw"
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
			console.log('-------------')
			console.log('me user >', me)
			console.log('-------------')

			return {
				models,
				me,
				mixpanel,
				secret: process.env.SECRET,
				s3
			}
		}
	},
	introspection: true,
	playground: true,
	tracing: true,
	playground: {
		settings: {
			'editor.theme': 'dark',
			"editor.cursorShape": "block",
		},
	}
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
			messages: [
				{
					text: 'SQL god'
				},
				{
					text: 'PHP over everything',
				},
			],
		},
		{
			include: [models.Message]
		}
	);
};

