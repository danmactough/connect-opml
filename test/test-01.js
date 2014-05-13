var assert = require('assert')
  , connect = require('connect')
  , http = require('http')
  , fs = require('fs')
  , request = require('request');

module.exports = function (done) {
  var app = connect()
    , opml = require('../')
    , file = __dirname + '/assets/subscriptionList.opml';

  app.use(opml({ filter: function filterFn (outline) {
    return outline['#type'] === 'feed';
  } }))
     .use(function (req, res) {
      assert(req.body.meta);
      assert.equal(req.body.meta.title, 'mySubscriptions.opml');
      assert(Array.isArray(req.body.outlines));
      assert.strictEqual(req.body.outlines.length, 13);
      assert.strictEqual(req.body.outlines[1].title, 'washingtonpost.com - Politics');
      res.end( JSON.stringify(req.body.outlines) );
     });

  var server = http.createServer(app).listen();

  server.on('listening', function () {
    var port = this.address().port;
    fs.createReadStream(file).pipe(request.post('http://localhost:' + port, resp));
  });

  function resp (e, r, body) {
    assert.ifError(e);
    server.close();
    done();
  }
};
