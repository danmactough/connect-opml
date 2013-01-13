var assert = require('assert')
  , connect = require('connect')
  , http = require('http')
  , fs = require('fs')
  , request = require('request');

var app = connect()
  , opml = require('../')
  , file = __dirname + '/assets/subscriptionList.opml';

app.use(opml())
   .use(function (req, res) {
    if (!req.body.feeds) return res.end('[]');
    res.end( JSON.stringify(req.body.feeds) );
   });

var server = http.createServer(app).listen(3000);

server.on('listening', function () {
  fs.createReadStream(file).pipe(request.post('http://localhost:3000', resp));
});

function resp (e, r, body) {
  assert.ifError(e);
  var b = JSON.parse(body);
  assert.strictEqual(b.length, 13);
  assert.strictEqual(b[1].title, 'washingtonpost.com - Politics');
  console.log('ok - tests pass');
  server.close();
}