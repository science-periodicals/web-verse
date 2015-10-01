
(function () {
describe('WebVerse serializeRange', function () {
  it('should return nothing if no scope can be found', function () {
    var $tit = document.getElementsByTagName('title')[0]
      , range = document.createRange()
    ;
    range.setStart($tit, 0);
    range.setEnd($tit, 0);
    var res = WebVerse.serializeRange(range);
    assert.equal(res, undefined, 'returned undefined');
  });

  it('should default the scope', function () {
    htmlContent('<p id="x"><span>b</span></p>');
    var $span = document.getElementsByTagName('span')[0]
      , range = document.createRange()
    ;
    range.setStart($span, 0);
    range.setEnd($span, 0);
    var res = WebVerse.serializeRange(range);
    assert.equal(res.$scope.id, 'x', 'returned scope with id=x');
  });

  it('should return proper details', function () {
    htmlContent('<p id="x"> \n\t<span>hello</span>\n<span>world</span>  \n\f\v</p>');
    var $p = document.getElementsByTagName('p')[0]
      , $main = document.getElementsByTagName('main')[0]
      , range = document.createRange()
    ;
    range.setStart($p.firstChild, 3);
    range.setEnd($p.childNodes.item(3).firstChild, 5);
    var res = WebVerse.serializeRange(range, $main);
    assert.equal(res.$scope, $main, 'used the given scope');
    assert.equal(res.hash, hashedHW, 'hashed the content properly');
    assert.equal(res.key, 'hwhw', 'generates the correct key');
    assert.equal(res.startOffset, 0, 'normalised the start offset');
    assert.equal(res.endOffset, 11, 'normalised the end offset');
  });
});
describe('WebVerse serializeSelection', function () {
  it('should ignore collapsed selections', function () {
    var res = WebVerse.serializeSelection();
    assert.equal(res, undefined, 'returned undefined');
  });
  it('should serialise a selection', function () {
    htmlContent('<p id="x"> \n\t<span>hello</span>\n<span>world</span>  \n\f\v</p>');
    var $p = document.getElementsByTagName('p')[0]
      , range = document.createRange()
    ;
    range.setStart($p.firstChild, 3);
    range.setEnd($p.childNodes.item(3).firstChild, 5);
    var sel = window.getSelection();
    sel.addRange(range);
    var res = WebVerse.serializeSelection();
    assert.equal(res.$scope, $p, 'defaulted the scope');
    assert.equal(res.hash, hashedHW, 'hashed the content properly');
    assert.equal(res.key, 'hwhw', 'generates the correct key');
    assert.equal(res.startOffset, 0, 'normalised the start offset');
    assert.equal(res.endOffset, 11, 'normalised the end offset');
  });
});
})();
