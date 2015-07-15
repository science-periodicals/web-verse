var assert = require('assert')
  , jsdom = require('jsdom')
  , webVerse = require('..');


describe('webverse', function() {

  beforeEach(function(){
    webVerse.setBlacklist([]);
    webVerse.setIdentifier({
      key: 'data-key',
      hash: 'data-hash'
    });
  });

  describe('createKey', function() {
    describe('regular structured dom', function(){
        var $doc;
        before(function(done) {
          var html = '<html><body><style></style><div>    I am a paragraph with 2 sentences.    I am the second sentence.  Here is the third sentence.</div></body></html>';
          jsdom.env(html, function (err, window) {
            if (err) throw err;
            $doc = window.document;
            done();
          });
        });

        it('should compute a key', function() {
          assert.equal(webVerse.createKey($doc.getElementsByTagName('div')[0]), 'IaaIat');
        });

        it('should not compute a key', function() {
          assert(!$doc.getElementsByTagName('style')[0].hasAttribute('data-key'));
        });
    });
    describe('irregular structured dom', function(){
      var $doc;
      before(function(done) {
        var html = '<html><body><style></style><div><p>    I</p> <p>am  </p> <p>a</p> <p>paragraph</p> <p>with</p> <p>2</p> <p>sentences.</p>   <p>I</p> <p>am</p> <p>the</p> <p>second</p> <p>sentence.</p>  <p>Here</p> <p>is</p> <p>the</p> <p>third</p> <p>sentence.</p></div></body></html>';
        jsdom.env(html, function (err, window) {
          if (err) throw err;
          $doc = window.document;
          done();
        });
      });

      it('should compute a key', function() {
        assert.equal(webVerse.createKey($doc.getElementsByTagName('div')[0]), 'IaaIat');
      });

      it('should not compute a key', function() {
        assert(!$doc.getElementsByTagName('style')[0].hasAttribute('data-key'));
      });
    })
  });

  describe('setBlacklist', function(){
    var $doc;
    before(function(done) {
      var html = '<html><body><h1></h1><span></span></body></html>';
      jsdom.env(html, function (err, window) {
        if (err) throw err;
        $doc = window.document;
        done();
      });
    });

    it('should allow to set blacklist', function(){
      webVerse.setBlacklist(['H1', 'span']);
      webVerse.addIdentifiers($doc);

      var $h1 = $doc.getElementsByTagName('h1')[0];

      assert(!$h1.hasAttribute('data-key'));
      assert(!$h1.hasAttribute('data-hash'));

      var $span = $doc.getElementsByTagName('span')[0];

      assert(!$span.hasAttribute('data-key'));
      assert(!$span.hasAttribute('data-hash'));
    });

    it('support regex in blacklist', function(){
      webVerse.setBlacklist([/x\-.*/]);

      $doc.body.appendChild($doc.createElement('x-h1'));
      $doc.body.appendChild($doc.createElement('x-span'));

      webVerse.addIdentifiers($doc);

      var $h1 = $doc.getElementsByTagName('x-h1')[0];

      assert(!$h1.hasAttribute('data-key'));
      assert(!$h1.hasAttribute('data-hash'));

      var $span = $doc.getElementsByTagName('x-span')[0];

      assert(!$span.hasAttribute('data-key'));
      assert(!$span.hasAttribute('data-hash'));
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
      webVerse.addIdentifiers($doc);
      var $section = $doc.getElementsByTagName('section')[0];

      assert($section.getAttribute('data-key'));
      assert($section.getAttribute('data-hash'));

      webVerse.setIdentifier({
        key: 'test-key',
        hash: 'test-hash'
      });
      webVerse.addIdentifiers($doc);

      var $h1 = $doc.getElementsByTagName('h1')[0];

      assert($h1.getAttribute('test-key'));
      assert($h1.getAttribute('test-hash'));
    });
  });
});
