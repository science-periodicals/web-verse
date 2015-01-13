// inspired by https://github.com/NYTimes/Emphasis

var crypto = require('crypto');

/**
 * From a Paragraph, generate a Key
 * - Break Paragraph into Sentences
 * - Take first and last Sentences
 * - Sometimes the same. Thats ok.
 * - First character from the first three words of each sentence
 * - Each 6 char key refers to specific Paragraph
 */
function createKey($p) {
  var key = '';
  var len = 6;
  var txt = ($p.textContent || '').replace(/[^a-z\. ]+/gi, '').trim();

  if (txt && txt.length>1) {
    var lines = txt
          .split('.')
          .map(function(x) {return x.trim();})
          .filter(function(x) {return x;});

    if (lines.length) {
      var first = lines[0]
            .replace(/[\s\s]+/gi, ' ')
            .split(' ')
            .slice(0, (len/2))
            .map(function(x) {return x.trim();})
            .filter(function(x) {return x;});

      var last = lines[lines.length-1]
            .replace(/[\s\s]+/gi, ' ')
            .split(' ')
            .slice(0, (len/2))
            .map(function(x) {return x.trim();})
            .filter(function(x) {return x;});

      var k = first.concat(last);

      var max = (k.length>len) ? len : k.length;

      for (var i=0; i<max; i++) {
        key += k[i].substring(0, 1);
      }
    }
  }

  return key;
};


function serializeSelection() {

  //TODO compute prefix and suffix: get all the text nodes, and know
  //where the selection falls. get prefix and suffix and textnode
  //before and after the selection

  var selection = window.getSelection();
  var range;
  if (!selection.isCollapsed) {
    range = selection.getRangeAt(0);
  } else {
    return;
  }

  var $scope = range.commonAncestorContainer;
  if ($scope.nodeType === Node.TEXT_NODE) {
    $scope = selection.anchorNode.parentElement; //get closest Element
  };

  // get closest 'P'
  while ($scope.tagName !== 'P') {
    $scope = $scope.parentElement;
    if ($scope.tagName === 'BODY') {
      return;
    }
  }

  var key = createKey($scope);

  var it = document.createNodeIterator($scope, NodeFilter.SHOW_ALL);
  var node;
  var i = 0;
  var start, end;

  while (node = it.nextNode()) {
    if (node === range.startContainer){
      start = i;
    } else if (node === range.endContainer){
      end = i;
    }
    i++;
  }

  return {
    sha1: crypto.createHash('sha1').update($scope.textContent.trim()).digest('hex'),
    key: createKey($scope),
    start: start,
    end: end,
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    text: selection.toString()
  };

};


exports.createKey = createKey;
exports.serializeSelection = serializeSelection;
