
(function () {
function el (ln) {
  return document.getElementsByTagName(ln)[0];
}

var cases = [
  {
    desc: 'should bubble up from the text node',
    html: '<p id="x">a</p>',
    node: function () { return el('p').firstChild; },
    offsets: [0, 1],
    check: function ($node) { return $node.id; },
    result: 'x'
  },
  {
    desc: 'should bubble up from the text node, deeply',
    html: '<p id="x">a<span>b</span></p>',
    node: function () { return el('span').firstChild; },
    offsets: [0, 1],
    check: function ($node) { return $node.id; },
    result: 'x'
  },
  {
    desc: 'should bubble up from the text node, deeper',
    html: '<p id="x">a<span>b<span>b<strong>here</strong>bb</span></span></p>',
    node: function () { return el('strong').firstChild; },
    offsets: [0, 1],
    check: function ($node) { return $node.id; },
    result: 'x'
  },
  {
    desc: 'should stick to the given element',
    html: '<p id="x">a<span>b</span></p>',
    node: function () { return el('p'); },
    offsets: [0, 1],
    check: function ($node) { return $node.id; },
    result: 'x'
  },
  {
    desc: 'should abort at root <html>',
    html: 'hello',
    node: function () { return el('title'); },
    offsets: [0, 0],
    check: function ($node) { return typeof $node; },
    result: 'undefined'
  },
];

describe('WebVerse getScope', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      htmlContent(c.html);
      var $node = c.node()
        , range = document.createRange()
      ;
      range.setStart($node, c.offsets[0]);
      range.setEnd($node, c.offsets[1]);
      var $scope = WebVerse.getScope(range);
      assert.equal(c.check($scope), c.result, 'check produces ' + c.result);
    });
  });
});
})();
