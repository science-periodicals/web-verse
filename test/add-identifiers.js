
(function () {
describe('WebVerse addIdentifiers', function () {
  var hashedHello = '8b1a9953c4611296a827abf8c47804d7'
    , hashedWorld = '7d793037a0760186574b0282f2f435e7'
  ;

  it('should add identifiers', function () {
    htmlContent('<h1>Hello</h1><section><p>world</p></section>');
    var $citeable = WebVerse.addIdentifiers(document);

    var $h1 = $citeable.getElementsByTagName('h1')[0];
    assert($h1.getAttribute('data-id'), 'Has attribute data-id');
    assert.equal($h1.getAttribute('data-hash'), hashedHello, 'Has the correct hash in data-hash');
    assert.equal($h1.getAttribute('data-key'), 'HH', 'Has the correct key in data-key');

    var $section = $citeable.getElementsByTagName('section')[0];
    assert($section.getAttribute('data-id'), 'Has data-id on section');
    assert.equal($section.getAttribute('data-hash'), hashedWorld, 'Has data-hash on section');
    assert($section.getAttribute('data-key'), 'Has data-key on section');
  });
});
})();
