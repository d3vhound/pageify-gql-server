'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _post = require('./post');

var _post2 = _interopRequireDefault(_post);

var _files = require('./files');

var _files2 = _interopRequireDefault(_files);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [_user2.default, _message2.default, _post2.default, _files2.default];