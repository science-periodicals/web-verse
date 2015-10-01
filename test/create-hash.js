
(function () {
var cases = [
  {
    desc: 'should without space',
    in: 'Hello',
    out: hashedHello
  },
  {
    desc: 'should hash with trimmable space',
    in: '   \f\vworld\n\t\u00a0',
    out: hashedWorld
  },
  {
    desc: 'should hash with normalised space',
    in: '\uFEFF\n \thello\r \nworld\xA0\t\r',
    out: hashedHW
  },
];

describe('WebVerse createHash', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      var $el = document.createElement('div');
      $el.textContent = c.in;
      var out = WebVerse.createHash($el);
      assert.equal(out, c.out, 'hashes');
    });
  });
});
})();
