(function () {
var cases = [
  {
    desc: 'should compute a key over 2 simple sentences',
    text: '    I am a paragraph with 2 sentences.    I am the second sentence.',
    key:  'IaaIat'
  },
  {
    desc: 'should use the one sentence twice',
    text: '    I am a paragraph with 2 sentences.\n',
    key:  'IaaIaa'
  },
  {
    desc: 'should work with too few words',
    text: '    hello world\n',
    key:  'hwhw'
  },
  {
    desc: 'should work with too few words',
    text: '    Hello! World!\n',
    key:  'HWHW'
  },
  {
    desc: 'should handle only spaces',
    text: '    \n',
    key:  ''
  },
  {
    desc: 'should handle the void',
    text: '',
    key:  ''
  },
];
describe('WebVerse createKey', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      htmlContent('<p>' + c.text + '</p>');
      var $p = document.getElementsByTagName('p')[0]
        , key = WebVerse.createKey($p)
      ;
      assert.equal(key, c.key, 'created key matches');
    });
  });
});
})();
