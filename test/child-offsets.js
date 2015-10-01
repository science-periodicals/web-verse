
(function () {
var cases = [
  {
    desc: 'should work on the simplest child',
    html: '<p><span>a</span></p>',
    parent: 'p',
    child:  'span',
    offsets: [0, 1]
  },
  {
    desc: 'should work with prefix text',
    html: '<p> aha <span>abc</span></p>',
    parent: 'p',
    child:  'span',
    offsets: [5, 8]
  },
  {
    desc: 'should work on second child',
    html: '<p> aha <span>abc</span> hmm <strong> x </strong></p>',
    parent: 'p',
    child:  'strong',
    offsets: [13, 16]
  },
];

describe('WebVerse getChildOffsets', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      htmlContent(c.html);
      var $parent = document.getElementsByTagName(c.parent)[0]
        , $child = document.getElementsByTagName(c.child)[0]
        , offsets = WebVerse.getChildOffsets($parent, $child)
      ;
      assert.equal(offsets.startOffset, c.offsets[0], 'start offsets match');
      assert.equal(offsets.endOffset, c.offsets[1], 'end offsets match');
    });
  });
});
})();
