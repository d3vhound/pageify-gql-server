'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _templateObject = _taggedTemplateLiteral(['\n  extend type Query {\n    messages(limit: Int): [Message!]!\n    message(id: ID!): Message!\n  }\n\n  extend type Mutation {\n    createMessage(text: String!): Message!\n    deleteMessage(id: ID!): Boolean!\n  }\n\n  type Message {\n    id: ID!\n    text: String!\n    user: User!\n  }\n'], ['\n  extend type Query {\n    messages(limit: Int): [Message!]!\n    message(id: ID!): Message!\n  }\n\n  extend type Mutation {\n    createMessage(text: String!): Message!\n    deleteMessage(id: ID!): Boolean!\n  }\n\n  type Message {\n    id: ID!\n    text: String!\n    user: User!\n  }\n']);

var _apolloServerExpress = require('apollo-server-express');

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

exports.default = (0, _apolloServerExpress.gql)(_templateObject);