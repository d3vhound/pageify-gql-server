'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _templateObject = _taggedTemplateLiteral(['\n\textend type Query {\n\t\tuploads: [File]\n\t}\n\n\ttype File {\n\t\tfilename: String!\n\t\tmimetype: String!\n\t\tencoding: String!\n\t\tfile_url: String\n\t}\n\n\textend type Mutation {\n\t\tsingleUpload(file: Upload!): File\n\t}\n\n'], ['\n\textend type Query {\n\t\tuploads: [File]\n\t}\n\n\ttype File {\n\t\tfilename: String!\n\t\tmimetype: String!\n\t\tencoding: String!\n\t\tfile_url: String\n\t}\n\n\textend type Mutation {\n\t\tsingleUpload(file: Upload!): File\n\t}\n\n']);

var _apolloServerExpress = require('apollo-server-express');

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

exports.default = (0, _apolloServerExpress.gql)(_templateObject);