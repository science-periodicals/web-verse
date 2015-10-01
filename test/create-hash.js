
(function () {
var hashedHello = '8b1a9953c4611296a827abf8c47804d7'
  , hashedWorld = '7d793037a0760186574b0282f2f435e7'
  , hashedHW = '5eb63bbbe01eeed093cb22bb8f5acdc3'
  , cases = [
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
