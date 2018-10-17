'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _templateObject = _taggedTemplateLiteral(['\n  type Query {\n    _: Boolean\n  }\n\n  type Mutation {\n    _: Boolean\n  }\n\n  type Subscription {\n    _: Boolean\n  }\n'], ['\n  type Query {\n    _: Boolean\n  }\n\n  type Mutation {\n    _: Boolean\n  }\n\n  type Subscription {\n    _: Boolean\n  }\n']);

var _apolloServerExpress = require('apollo-server-express');

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _post = require('./post');

var _post2 = _interopRequireDefault(_post);

var _files = require('./files');

var _files2 = _interopRequireDefault(_files);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var linkSchema = (0, _apolloServerExpress.gql)(_templateObject);

exports.default = [linkSchema, _user2.default, _message2.default, _post2.default, _files2.default];