import { gql } from 'apollo-server-express';

export default gql`
	extend type Query {
		uploads: [File]
	}

	type File {
		filename: String!
		mimetype: String!
		encoding: String!
		file_url: String
	}

	extend type Mutation {
		singleUpload(file: Upload!): File
	}

`