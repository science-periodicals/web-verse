
var cases = [
  {
    desc: 'should handle a trivial string',
    text: 'a',
    raw: 0,
    norm: 0
  },
  {
    desc: 'should handle a trivial string, inside',
    text: 'a',
    raw: 1,
    norm: 1
  },
  {
    desc: 'should handle a little bit of space',
    text: ' a',
    raw: 1,
    norm: 0
  },
  {
    desc: 'should handle trimming',
    text: '    \n\t\r\uFEFFa',
    raw: 8,
    norm: 0
  },
  {
    desc: 'should handle normalising',
    text: '    \n\t\r\uFEFFa\n\t\r b',
    raw: 13,
    norm: 2
  },
  {
    desc: 'should handle end',
    text: ' a b ',
    raw: 4,
    norm: 3
  },
  {
    desc: 'should handle between',
    text: ' a b ',
    raw: 2,
    norm: 1
  },
];

describe('WebVerse normalizeOffset', function () {
  cases.forEach(function (c) {
    it(c.desc + ' [normalising]', function () {
      var norm = WebVerse.normalizeOffset(c.raw, c.text);
      assert.equal(norm, c.norm, 'offset normalised');
    });
  });
});

describe('WebVerse denormalizeOffset', function () {
  cases.forEach(function (c) {
    it(c.desc + ' [denormalising]', function () {
      var raw = WebVerse.denormalizeOffset(c.norm, c.text);
      assert.equal(raw, c.raw, 'offset denormalised');
    });
  });
});
