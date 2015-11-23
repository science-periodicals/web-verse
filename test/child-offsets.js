
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
    offsets: [4, 7]
  },
  {
    desc: 'should work on second child',
    html: '<p> aha <span>abc</span>   hmm <strong> x </strong></p>',
    parent: 'p',
    child:  'strong',
    offsets: [12, 14]
  },
  {
    desc: 'should work when first text node is not a direct child of the child',
    html: '<article><section><p>hello</p></section></article>',
    parent: 'article',
    child:  'section',
    offsets: [0, 5]
  },
  {
    desc: 'should work when the last text node is not the same node as the first text node',
    html: '<article><section><h2>hello</h2><p>world</p></section><section><h2>hola</h2></section></article>',
    parent: 'article',
    child:  'section',
    offsets: [0, 10]
  }
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
