
var cases = [
  {
    desc: 'should find the simplest string',
    html: '<p id="x">a</p>',
    text: 'a',
    ranges: [
      { startID: 'x', start: 0, endID: 'x', end: 1 }
    ]
  },
  {
    desc: 'should handle a bit of space',
    html: '<p id="x">  \n a\n\t  </p>',
    text: 'a',
    ranges: [
      { startID: 'x', start: 4, endID: 'x', end: 5 }
    ]
  },
  {
    desc: 'should handle search string with space',
    html: '<p id="x"> a b</p>',
    text: 'a b',
    ranges: [
      { startID: 'x', start: 1, endID: 'x', end: 4 }
    ]
  },
  {
    desc: 'should handle search string with space',
    html: '<p id="x">  \n a b\na\nb  a\t   b  </p>',
    text: 'a b',
    ranges: [
      { startID: 'x', start: 4, endID: 'x', end: 7 },
      { startID: 'x', start: 8, endID: 'x', end: 11 },
      { startID: 'x', start: 13, endID: 'x', end: 19 }
    ]
  },
];

describe('WebVerse getRangesFromText', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      htmlContent(c.html);
      var main = document.getElementsByTagName('main')[0];
      var ranges = WebVerse.getRangesFromText(main, c.text);
      assert.equal(ranges.length, c.ranges.length, 'found ' + c.ranges.length + ' instances of ' + c.text);
      c.ranges.forEach(function (r, idx) {
        assert.equal(ranges[idx].startContainer.parentNode.id, r.startID, 'range ' + idx + ' starts in id=' + r.startID);
        assert.equal(ranges[idx].endContainer.parentNode.id, r.endID, 'range ' + idx + ' ends in id=' + r.endID);
        assert.equal(ranges[idx].startOffset, r.start, 'range ' + idx + ' starts at ' + r.start);
        assert.equal(ranges[idx].endOffset, r.end, 'range ' + idx + ' ends at ' + r.end);
      });
    });
  });
});
