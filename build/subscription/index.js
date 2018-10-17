'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.EVENTS = undefined;

var _apolloServer = require('apollo-server');

var _post = require('./post');

var POST_EVENTS = _interopRequireWildcard(_post);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var EVENTS = exports.EVENTS = {
	POST: POST_EVENTS
};

exports.default = new _apolloServer.PubSub();