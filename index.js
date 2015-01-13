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
    //TODO use https://github.com/Tessmore/sbd or something similar
    var lines = txt
          .split('.')
          .map(function(x) {return x.trim();})
          .filter(function(x) {return x;});

    if (lines.length) {
      var first = lines[0].match(/\S+/g).slice(0, (len/2));
      var last = lines[lines.length-1].match(/\S+/g).slice(0, (len/2));
      var k = first.concat(last);

      var max = (k.length>len) ? len : k.length;

      for (var i=0; i<max; i++) {
        key += k[i].substring(0, 1);
      }
    }
  }

  return key;
};

//key:start-end
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

  var startTextNode, endTextNode;
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    startTextNode = range.startContainer;
  } else {
    for (var i=0; i<range.startContainer.childNodes.length; i++) {
      if (range.startContainer.childNodes[i].nodeType === Node.TEXT_NODE) {
        startTextNode = range.startContainer.childNodes[i];
        break;
      }
    }
  }

  if (range.endContainer.nodeType === Node.TEXT_NODE) {
    endTextNode = range.endContainer;
  } else {
    for (var j=0; j<range.endContainer.childNodes.length; j++) {
      if (range.endContainer.childNodes[j].nodeType === Node.TEXT_NODE) {
        endTextNode = range.endContainer.childNodes[j];
        break;
      }
    }
  }

  var node, indStartTextNode, indEndTextNode, ind=0, textNodes = [];
  var it = document.createNodeIterator($scope, NodeFilter.SHOW_TEXT);
  while (node = it.nextNode()) {
    textNodes.push(node);
    if (node === startTextNode) {
      indStartTextNode = ind;
    }
    if (node === endTextNode) {
      indEndTextNode = ind;
      break;
    }
    ind++;
  }

  var startOffset = textNodes.slice(0, indStartTextNode).reduce(function(a, b){
    return a + b.textContent.length;
  }, 0);
  if (range.startOffset !== undefined) {
    startOffset += range.startOffset;
  }

  var endOffset = textNodes.slice(0, indEndTextNode).reduce(function(a, b){
    return a + b.textContent.length;
  }, 0);
  if (range.endOffset !== undefined) {
    endOffset += range.endOffset;
  }

  return {
    $scope: $scope,
    sha1: crypto.createHash('sha1').update($scope.textContent.trim()).digest('hex'),
    key: createKey($scope),
    startOffset: startOffset,
    endOffset: endOffset,
    text: selection.toString()
  };

};

function rangeFromOffsets($scope, startOffset, endOffset) {
  var node;
  var it = document.createNodeIterator($scope, NodeFilter.SHOW_TEXT);
  var acc = 0;
  var startNode, endNode, relStartOffset, relEndOffset;

  while (node = it.nextNode()) {
    if (relStartOffset === undefined && ((acc + node.textContent.length) >= startOffset)) {
      startNode = node;
      relStartOffset = startOffset-acc;
    }
    if (relEndOffset === undefined && ((acc + node.textContent.length) >= endOffset)) {
      endNode = node;
      relEndOffset = endOffset-acc;
      break;
    }
    acc += node.textContent.length;
  }

  var range = document.createRange();
  range.setStart(startNode, relStartOffset);
  range.setEnd(endNode, relEndOffset);

  return range;
};


exports.createKey = createKey;
exports.serializeSelection = serializeSelection;
exports.rangeFromOffsets = rangeFromOffsets;
