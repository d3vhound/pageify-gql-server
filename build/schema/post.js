'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _templateObject = _taggedTemplateLiteral(['\n\nextend type Query {\n\tposts: [Post!]\n\tpost(id: ID!): Post\n\tfeed(offset: Int, limit: Int): [Post!]\n}\n\nextend type Mutation {\n\tcreatePost(\n\t\ttext: String!\n\t\tmedia: [Upload]\n\t\ttype: String\n\t): Post!\n\n\tdeletePost(\n\t\tid: ID!\n\t): Boolean!\n}\n\ntype Post {\n\tid: ID!\n\tuser: User!\n\ttext: String!\n\tmedia: [File2]\n\tlikes: Int\n\treplies: [Post]\n\tcreatedAt: String!\n\tliked: Boolean\n\ttype: String\n}\n\ntype File2 {\n\tfilename: String\n  mimetype: String\n  encoding: String\n\tkey: String\n}\n\nextend type Subscription {\n\tpostCreated: PostCreated!\n\tpostAddedToFeed(\n\t\tfeedOwner: Int!\n\t): PostCreated!\n}\n\ntype PostCreated {\n\tpost: Post!\n\tfollowersToNotify: [ID!]\n}\n\n\n'], ['\n\nextend type Query {\n\tposts: [Post!]\n\tpost(id: ID!): Post\n\tfeed(offset: Int, limit: Int): [Post!]\n}\n\nextend type Mutation {\n\tcreatePost(\n\t\ttext: String!\n\t\tmedia: [Upload]\n\t\ttype: String\n\t): Post!\n\n\tdeletePost(\n\t\tid: ID!\n\t): Boolean!\n}\n\ntype Post {\n\tid: ID!\n\tuser: User!\n\ttext: String!\n\tmedia: [File2]\n\tlikes: Int\n\treplies: [Post]\n\tcreatedAt: String!\n\tliked: Boolean\n\ttype: String\n}\n\ntype File2 {\n\tfilename: String\n  mimetype: String\n  encoding: String\n\tkey: String\n}\n\nextend type Subscription {\n\tpostCreated: PostCreated!\n\tpostAddedToFeed(\n\t\tfeedOwner: Int!\n\t): PostCreated!\n}\n\ntype PostCreated {\n\tpost: Post!\n\tfollowersToNotify: [ID!]\n}\n\n\n']);

var _apolloServerExpress = require('apollo-server-express');

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

exports.default = (0, _apolloServerExpress.gql)(_templateObject);