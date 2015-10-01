
(function () {
var cases = [
  {
    desc: 'should work on the simplest string',
    html: '<p id="x">a</p>',
    offsets: [0, 1],
    range: { startID: 'x', start: 0, endID: 'x', end: 1 }
  },
  {
    desc: 'should handle a bit of space',
    html: '<p id="x">  \n a\n\t  </p>',
    offsets: [0, 1],
    range: { startID: 'x', start: 4, endID: 'x', end: 5 }
  },
  {
    desc: 'should handle inner space',
    html: '<p id="x">  \n a\n\tb  </p>',
    offsets: [0, 3],
    range: { startID: 'x', start: 4, endID: 'x', end: 8 }
  },
];

describe('WebVerse rangeFromOffsets', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      htmlContent(c.html);
      var $main = document.getElementsByTagName('main')[0];
      var range = WebVerse.rangeFromOffsets($main, c.offsets[0], c.offsets[1])
        ,  r = c.range
      ;
      assert.equal(range.startContainer.parentNode.id, r.startID, 'range starts in id=' + r.startID);
      assert.equal(range.endContainer.parentNode.id, r.endID, 'range ends in id=' + r.endID);
      assert.equal(range.startOffset, r.start, 'range starts at ' + r.start);
      assert.equal(range.endOffset, r.end, 'range ends at ' + r.end);
    });
  });
});

describe('WebVerse getOffsets', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      htmlContent(c.html);
      var $main = document.getElementsByTagName('main')[0];
      document.normalize;
      var range = document.createRange()
      ,   r = c.range;
      range.setStart(document.getElementById(r.startID).firstChild, r.start);
      range.setEnd(document.getElementById(r.endID).firstChild, r.end);
      var offsets = WebVerse.getOffsets(range, $main);
      assert.equal(offsets.startOffset, c.offsets[0], 'start offset is ' + c.offsets[0]);
      assert.equal(offsets.endOffset, c.offsets[1], 'end offset is ' + c.offsets[1]);
    });
  });
});
})();
