var assert = require('assert')
  , async = require('async');

var start = Date.now();

var tests = [
      require('./test-01'),
      require('./test-02')
    ],
    iter = function (test, next) {
      test(next);
    },
    done = function (err, results) {
      if (err) throw err;
      assert.equal(results.length, tests.length);
      console.log('ok - tests pass');
      process.exit();
    };

async.map(tests, iter, done);

setInterval(function () {
  if ((Date.now() - start) / tests.length > 1000) {
    throw new Error('timeout');
  }
  return
}, 50);
