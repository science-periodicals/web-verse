
var cases = [
  {
    desc: 'should handle a trivial string',
    text: 'a',
    raw: '0',
    norm: '0'
  },
  {
    desc: 'should handle a trivial string, inside',
    text: 'a',
    raw: '1',
    norm: '1'
  },
  {
    desc: 'should handle trimming',
    text: '    \n\t\r\uFEFFa',
    raw: '8',
    norm: '0'
  },
  {
    desc: 'should handle normalising',
    text: '    \n\t\r\uFEFFa\n\t\r b',
    raw: '13',
    norm: '2'
  },
];

describe('WebVerse normalizeOffset', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      var norm = WebVerse.normalizeOffset(c.raw, c.text);
      assert.equal(norm, c.norm, 'offset normalised');
    });
  });
});
