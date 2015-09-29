
describe('WebVerse Basics', function () {
  describe('createKey', function () {
    it('should compute a key', function () {
      htmlContent('<p>    I am a paragraph with 2 sentences.    I am the second sentence.</p>');
      assert.equal(WebVerse.createKey(document.getElementsByTagName('p')[0]), 'IaaIat', 'Creating a key');
    });
  });

  describe('addIdentifiers', function () {
    // this is the output of crypto.createHash('sha1').update('Hello', 'utf8').digest('hex');
    var hashedHello = 'f7ff9e8b7bb2e09b70935a5d785e0cc5d9d0abf0'
      // same with 'world'
      , hashedWorld = '7c211433f02071597741e6ff5a8ea34789abbf43'
    ;

    it('should add identifiers', function () {
      htmlContent('<h1>Hello</h1><section><p>world</p></section>');
      var $citeable = WebVerse.addIdentifiers(document);

      var $h1 = $citeable.getElementsByTagName('h1')[0];
      assert($h1.getAttribute('data-id'), 'Has attribute data-id');
      assert.equal($h1.getAttribute('data-hash'), hashedHello, 'Has the correct hash in data-hash');
      assert.equal($h1.getAttribute('data-key'), 'HH', 'Has the correct key in data-key');
    });
  });
});
