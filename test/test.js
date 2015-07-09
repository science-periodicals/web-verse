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
      assert(!$doc.getElementsByTagName('style')[0].hasAttribute('data-key'));
    });
  });

  describe('setBlacklist', function(){
    var $doc;
    before(function(done) {
      var html = '<html><body><h1></h1></body></html>';
      jsdom.env(html, function (err, window) {
        if (err) throw err;
        $doc = window.document;
        done();
      });
    });

    it('should allow to set blacklist', function(){
      webVerse.setBlacklist(['H1']);
      webVerse.addIdentifiers($doc);

      var $h1 = $doc.getElementsByTagName('h1')[0];

      assert(!$h1.hasAttribute('test-key'));
      assert(!$h1.hasAttribute('test-hash'));
    })
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
      webVerse.addIdentifiers($doc);
      var $section = $doc.getElementsByTagName('section')[0];

      assert($section.getAttribute('data-key'));
      assert($section.getAttribute('data-hash'));

      var $h1 = $doc.getElementsByTagName('h1')[0];

      assert($h1.getAttribute('data-key'));
      assert($h1.getAttribute('data-hash'));

      webVerse.setIdentifier({
        key: 'test-key',
        hash: 'test-hash'
      });
    });
  });
});
