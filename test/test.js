var assert = require('assert')
  , jsdom = require('jsdom')
  , webVerse = require('..');


describe('webverse', function() {

  describe('createKey', function() {

    var $doc;

    before(function(done) {
      var html = '<html><body><style></style><p>    I am a paragraph with 2 sentences.    I am the second sentence.</p></body></html>';
      jsdom.env(html, function (err, window) {
        if (err) throw err;
        $doc = window.document;
        done();
      });
    });

    it('should compute a key', function() {
      assert.equal(webVerse.createKey($doc.getElementsByTagName('p')[0]), 'IaaIat');
    });

    it('should not compute a key', function() {
      assert(!webVerse.createKey($doc.getElementsByTagName('style')[0]));
    });
  });

  describe('addIdentifiers', function() {
    var $doc;

    before(function(done) {
      var html = '<html><body><h1>Hello</h1><section><p>world</p></section></body></html>';
      jsdom.env(html, function (err, window) {
        if (err) throw err;

        $doc = window.document;
        done();
      });
    });

    it('should add identifiers', function() {
      var $citeable = webVerse.addIdentifiers($doc);

      assert($citeable.getElementsByTagName('section')[0].getAttribute('data-key'));
      assert($citeable.getElementsByTagName('h1')[0].getAttribute('data-key'));
      assert($citeable.getElementsByTagName('body')[0].getAttribute('data-key'));
    });

  });

});
