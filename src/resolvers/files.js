import { combineResolvers } from 'graphql-resolvers'
import { isAuthenticated } from './authorization'
const fs = require('fs')
import uuidv4 from 'uuid/v4'

const storeUpload = ({ stream, mimetype, s3 }) => 
	new Promise((resolve, reject) => {
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
				return console.error('Error', err)
			}

			if (data) {
				// console.log(data)
				resolve(data.Location)
			}
		})
		
		stream.on('end', () => console.log('end'))
		stream.on('error', reject)
	})


export default {
	Query: {
		uploads: () => {
			// return records of files uploaded from db
		}
	},

	Mutation: {
		async singleUpload(parent, { file }, { models, me, s3 }) {
			const { stream, filename, mimetype, encoding } = await file 

			let file_url = await storeUpload({ stream, s3, mimetype }).then((value) => {
				console.log(value)
				// file_url = value
				return value
			})


			await models.User.update({
				avatar: file_url
			}, {
				where: {
					id: me.id
				}
			})

			return { filename, mimetype, encoding, file_url }

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