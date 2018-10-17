'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _graphqlResolvers = require('graphql-resolvers');

var _authorization = require('./authorization');

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs');


var storeUpload = function storeUpload(_ref) {
	var stream = _ref.stream,
	    mimetype = _ref.mimetype,
	    s3 = _ref.s3;
	return new Promise(function (resolve, reject) {
		var uuidFilename = (0, _v2.default)();

		var params = {
			Bucket: 'pageify',
			Body: stream,
			Key: uuidFilename,
			ContentType: mimetype,
			ACL: 'public-read'
		};

		s3.upload(params, function (err, data) {
			if (err) {
				return console.error('Error', err);
			}

			if (data) {
				console.log(data);
				resolve(data.Location);
			}
		});

		stream.on('end', function () {
			return console.log('end');
		});
		stream.on('error', reject);
	});
};

exports.default = {
	Query: {
		uploads: function uploads() {
			// return records of files uploaded from db
		}
	},

	Mutation: {
		singleUpload: function singleUpload(parent, _ref2, _ref3) {
			var _this = this;

			var file = _ref2.file;
			var models = _ref3.models,
			    me = _ref3.me,
			    s3 = _ref3.s3;
			return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
				var _ref4, stream, filename, mimetype, encoding, file_url;

				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								_context.next = 2;
								return file;

							case 2:
								_ref4 = _context.sent;
								stream = _ref4.stream;
								filename = _ref4.filename;
								mimetype = _ref4.mimetype;
								encoding = _ref4.encoding;
								_context.next = 9;
								return storeUpload({ stream: stream, s3: s3, mimetype: mimetype }).then(function (value) {
									console.log(value);
									// file_url = value
									return value;
								});

							case 9:
								file_url = _context.sent;
								_context.next = 12;
								return models.User.update({
									avatar: file_url
								}, {
									where: {
										id: me.id
									}
								});

							case 12:
								return _context.abrupt('return', { filename: filename, mimetype: mimetype, encoding: encoding, file_url: file_url

									// 2. Stream file contents into cloud storage

									// 3. Record the file upload into db
									// const id = await recordFile(...)

								});

							case 13:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, _this);
			}))();
		}
	}

};