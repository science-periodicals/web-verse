var assert = require('assert')
  , jsdom = require('jsdom')
  , crypto = require('crypto')
  , webVerse = require('..');


describe('webverse', function() {

  describe('createKey', function() {

    var $doc;

    before(function(done) {
      var html = '<html><body><p>    I am a paragraph with 2 sentences.    I am the second sentence.</p></body></html>';
      jsdom.env(html, function (err, window) {
        if (err) throw err;
        $doc = window.document;
        done();
      });
    });

    it('should compute a key', function() {
      assert.equal(webVerse.createKey($doc.getElementsByTagName('p')[0]), 'IaaIat');
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

      var $h1 = $citeable.getElementsByTagName('h1')[0];
      assert($h1.getAttribute('data-id'));
      assert.equal($h1.getAttribute('data-hash'), crypto.createHash('sha1').update('Hello', 'utf8').digest('hex'));
      assert.equal($h1.getAttribute('data-key'), 'HH');

      var $section = $citeable.getElementsByTagName('section')[0];
      assert($section.getAttribute('data-id'));
      assert.equal($section.getAttribute('data-hash'), crypto.createHash('sha1').update('world', 'utf8').digest('hex'));
      assert(!$section.getAttribute('data-key'));
    });

  });

});
