import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
const fs = require('fs')
import uuidv4 from 'uuid/v4'

export default {
	Query: {
		uploads: () => {
			// return records of files uploaded from db
		}
	},

	Mutation: {
		async singleUpload(parent, { file }, { s3 }) {
			const { stream, filename, mimetype, encoding } = await file
			// 1. validate metadata

			if (!filename) {
				return false
			} else {
				// stream.on('data', (chunk) => {
				// 	console.log(`Received ${chunk.length} bytes of data.`);
				// })

				const uuidFilename = uuidv4()

				const params = {
					Bucket: 'pageify',
					Body: stream,
					Key: uuidFilename,
					ContentType: mimetype,
					ACL: 'public-read'
				}

				s3.upload(params, (err, data) => {
					if (err) {
						console.log('Error', err)
					}

					if (data) {
						console.log('Uploaded:', data)
					}
				})

				return { filename, mimetype, encoding }
			}

			// 2. Stream file contents into cloud storage

			// 3. Record the file upload into db
			// const id = await recordFile(...)

		},

		// singleUpload:	combineResolvers(
		// 	isAuthenticated,
		// 	async (parent, { file }, { upload }) => {
		// 		return { filename, mimetype, encoding}
		// 	}
		// )
	},

}