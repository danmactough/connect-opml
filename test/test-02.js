var assert = require('assert')
  , connect = require('connect')
  , http = require('http')
  , fs = require('fs')
  , request = require('request');

module.exports = function (done) {
  var app = connect()
    , opml = require('../')
    , file = __dirname + '/assets/subscriptionList.opml';

  app.use(opml({ limit: 1 }))

  var server = http.createServer(app).listen();

  server.on('listening', function () {
    var port = this.address().port;
    fs.createReadStream(file).pipe(request.post('http://localhost:' + port, resp));
  });

  function resp (e, r, body) {
    assert.ifError(e);
    assert.equal(r.statusCode, 413);
    assert.ok(body.match(/request entity too large/));
    server.close();
    done();
  }
};