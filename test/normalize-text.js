
var cases = [
  {
    desc: 'should trim pre and post',
    in: '  a  ',
    out: 'a'
  },
  {
    desc: 'should normalise inside',
    in: 'a   b',
    out: 'a b'
  },
  {
    desc: 'hairy',
    in: '\uFEFF\n \ta\r \nb\xA0\t\r',
    out: 'a b'
  },
];

describe('WebVerse normalizeText', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      var out = WebVerse.normalizeText(c.in);
      assert.equal(out, c.out, 'string match');
    });
  });
});
