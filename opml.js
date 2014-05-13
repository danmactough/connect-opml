
/*!
 * Connect - opml
 * Copyright(c) 2013 Dan MacTough
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OpmlParser = require('opmlparser')
  , bytes = require('bytes')
  , typeis = require('type-is');

/**
 * OPML:
 *
 * Parse OPML request bodies, providing the
 * parsed object as `req.body`.
 *
 * Options:
 *
 *   - `passthrough` don't actually parse, just include the raw OPML as req.body
 *   - `limit`       byte limit disabled by default
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function (options) {
  options = options || {};

  var limit = '1mb';
  if ('number' === typeof options.limit)
    limit = options.limit;
  if ('string' === typeof options.limit)
    limit = bytes(options.limit);

  return function opml (req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};

    if (!hasBody(req)) return next();

    // check Content-Type
    if (!typeis(req, ['text/x-opml', 'text/xml', 'application/xml'])) return next();

    // flag as parsed
    req._body = true;

    req.body = {
      meta: {},
      outlines: []
    };

    var received = 0
      , _abort;
    req.on('data', function checklength (chunk) {
      received += chunk.length;
      if (limit && received > limit) {
        if (typeof req.pause === 'function')
          req.pause();
        _abort = true;
        next(makeError(new Error(), 413, 'request entity too large'));
      }
    });
    var opmlparser = new OpmlParser();
    opmlparser.on('error', next);
    opmlparser.once('readable', function () {
      req.body.meta = this.meta;
    });
    opmlparser.on('readable', function () {
      var stream = this, outline;
      while (outline = stream.read()) {
        if (!options.filter || 'function' !== typeof options.filter || options.filter(outline)) {
          req.body.outlines.push(outline);
        }
      }
    });
    opmlparser.on('end', function () {
      if (!_abort) {
        if (0 === received.length) {
          return next(makeError(new Error(), 400, 'invalid OPML, empty body'));
        }
        next();
      }
    });

    // parse
    req.pipe(opmlparser);
  };
};

function makeError (error, code, message) {
  error.message = message;
  error.status = error.statusCode = code;
  return error;
}

// utility function copied from Connect

function hasBody(req) {
  var encoding = 'transfer-encoding' in req.headers,
      length = 'content-length' in req.headers
               && req.headers['content-length'] !== '0';
  return encoding || length;
};
