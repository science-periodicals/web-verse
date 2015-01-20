// inspired by https://github.com/NYTimes/Emphasis

var crypto = require('crypto')
  , sbd = require('sbd')
  , levenshtein = require('fast-levenshtein');

var citeable = exports.citeable = ['P', 'LI', 'DD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'FIGCAPTION', 'CAPTION', 'ASIDE'];

/**
 * From a block element, generate a Key
 * - Break block element text content into Sentences
 * - Take first and last Sentences
 * - Sometimes the same. Thats ok.
 * - First character from the first three words of each sentence
 * - Each 6 char key refers to specific block element
 */
var createKey = exports.createKey = function($el) {
  var key = '';
  var len = 6;
  var txt = ($el.textContent || '').replace(/[^a-z\. ]+/gi, '').trim();

  if (txt && txt.length>1) {
    var lines = sbd.sentences(txt)
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

var createHash = exports.createHash = function($el, algorithm) {
  algorithm = algorithm || 'sha1';
  return crypto.createHash(algorithm).update($el.textContent.trim()).digest('hex'); //TODO textContent.replace(/\s+/g, ' ') ??
};

//key:start-end
exports.serializeSelection = function() {
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

  // TODO generalize to list of supported block elements
  // get closest citeable element
  while (!~citeable.indexOf($scope.tagName)) {
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
    return a + b.textContent.trim().length;
  }, 0);
  if (range.startOffset !== undefined) {
    startOffset += range.startOffset - (startTextNode.textContent.length - startTextNode.textContent.replace(/^\s+/, '').length); //we substract the effect of having trimmed the textContent
  }

  var endOffset = textNodes.slice(0, indEndTextNode).reduce(function(a, b){
    return a + b.textContent.trim().length;
  }, 0);
  if (range.endOffset !== undefined) {
    endOffset += range.endOffset - (endTextNode.textContent.length - endTextNode.textContent.replace(/^\s+/, '').length); //we substract the effect of having trimmed the textContent;
  }

  return {
    $scope: $scope,
    sha1: createHash($scope),
    key: createKey($scope),
    startOffset: startOffset,
    endOffset: endOffset,
    text: selection.toString().trim()
  };

};

exports.rangeFromOffsets = function($scope, startOffset, endOffset) {
  var node;
  var it = document.createNodeIterator($scope, NodeFilter.SHOW_TEXT);
  var acc = 0;
  var startNode, endNode, relStartOffset, relEndOffset;
  var textContent;

  while (node = it.nextNode()) {
    textContent = node.textContent.trim();
    if (relStartOffset === undefined && ((acc + textContent.length) >= startOffset)) {
      startNode = node;
      relStartOffset = startOffset - acc + (startNode.textContent.length - startNode.textContent.replace(/^\s+/, '').length); //we add back the effect of having trimmed the textContent;
    }
    if (relEndOffset === undefined && ((acc + textContent.length) >= endOffset)) {
      endNode = node;
      relEndOffset = endOffset-acc + (endNode.textContent.length - endNode.textContent.replace(/^\s+/, '').length); //we add back the effect of having trimmed the textContent;
      break;
    }
    acc += textContent.length;
  }

  var range = document.createRange();
  range.setStart(startNode, relStartOffset);
  range.setEnd(endNode, relEndOffset);

  return range;
};

exports.findKey = function(target, candidates) {
  var x = {index: undefined, value: undefined, lev: undefined};

  for (var i=0; i<candidates.length; i++) {
    if (target === candidates[i]) {
      return {index: i, value: candidates[i], lev: 0};
    } else { //look for 1st closest Match
      var ls = levenshtein.get(target.slice(0, 3), candidates[i].slice(0, 3));
      var le = levenshtein.get(target.slice(-3), candidates[i].slice(-3));
      var lev = ls+le;
      if (lev < 3 && ((x.lev === undefined) || (lev<x.lev)) ) {
        x.index = i;
        x.value = candidates[i];
        x.lev = lev;
      }
    }
  }

  return x;
};
