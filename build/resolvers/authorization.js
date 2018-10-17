'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.isAuthenticated = undefined;

var _apolloServerExpress = require('apollo-server-express');

var _graphqlResolvers = require('graphql-resolvers');

var isAuthenticated = exports.isAuthenticated = function isAuthenticated(parent, args, _ref) {
	var me = _ref.me;
	return me ? _graphqlResolvers.skip : new _apolloServerExpress.ForbiddenError('Not authenticated as user');
};