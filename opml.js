
/*!
 * Connect - opml
 * Copyright(c) 2013 Dan MacTough
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var connect = require('connect')
  , OpmlParser = require('opmlparser')
  , utils = connect.utils
  , _limit = connect.middleware.limit;

/**
 * noop middleware.
 */

function noop(req, res, next) {
  next();
}

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
  var passthrough = 'passthrough' in options ? options.passthrough : false;

  var limit = options.limit ?
    _limit(options.limit) :
    noop;

  return function opml (req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};

    if (!utils.hasBody(req)) return next();

    // check Content-Type
    if ('text/x-opml' !== utils.mime(req)) return next();

    // flag as parsed
    req._body = true;

    // parse
    limit(req, res, function(err){
      if (err) return next(err);
      var buf = '';
      req.setEncoding('utf8');
      req.on('data', function(chunk){ buf += chunk; });
      req.on('end', function(){
        buf = buf.trim();

        if (0 === buf.length) {
          return next(400, 'invalid OPML, empty body');
        }

        if (passthrough) {
          req.body = buf;
          return next();
        }
        var parser = new OpmlParser();
        parser.parseString(buf, function (err, meta, feeds, outline) {
          if (err) return next(err);
          req.body = {
            _unparsed: buf,
            meta: meta,
            feeds: feeds,
            outline: outline
          };
          next();
        });
      });
    });
  };
};
