
// inspired by https://github.com/NYTimes/Emphasis

import Sha1 from 'sha.js/sha1';
import sbd from 'sbd';
import shortid from 'shortid';
import levenshtein from 'fast-levenshtein';
import escapeRegex from 'escape-regex-string';

const TEXT_NODE = 3;
const SHOW_TEXT = 4;
export let citeable = ['P', 'LI', 'DD', 'DT', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
                       'FIGCAPTION', 'CAPTION', 'ASIDE']
;

/**
 * From a block element, generate a Key
 * - Break block element text content into Sentences
 * - Take first and last Sentences
 * - Sometimes the same. That's ok.
 * - First character from the first three words of each sentence
 * - Each 6 char key refers to specific block element
 */
export function createKey ($el) {
  let key = '';
  let len = 6;
  let txt = ($el.textContent || '').replace(/[^\w\. ]+/gui, '').trim();

  if (txt && txt.length > 1) {
    let lines = sbd.sentences(txt).map(x => x.trim()).filter(x => x);
    if (lines.length) {
      let first = lines[0].match(/\S+/gu).slice(0, (len/2));
      let last = lines[lines.length-1].match(/\S+/gu).slice(0, (len/2));
      let k = first.concat(last);

      let max = (k.length > len) ? len : k.length;

      for (var i=0; i < max; i++) {
        key += k[i].substring(0, 1);
      }
    }
  }

  return key;
}

// create a sha1 hash for the trimmed content of the given element
export function createHash ($el) {
  let sha1 = new Sha1();
  // TODO: textContent.replace(/\s+/g, ' ') ??
  return sha1.update($el.textContent.trim(), 'utf8').digest('hex');
}

// given a range, find the enclosing block element that is part of our whitelist
export function getScope (range) {
  var $scope = range.commonAncestorContainer;
  if ($scope.nodeType === TEXT_NODE) {
    $scope = $scope.parentElement; //get closest Element
  };

  // get closest citeable element
  while (!~citeable.indexOf($scope.tagName)) {
    $scope = $scope.parentElement;
    if ($scope.tagName === 'HTML') {
      return;
    }
  }
  return $scope;
}

// Given a range and an element scope, return the start and end offsets into the text that ignore
// white space.
export function getOffsets (range, $scope) {
  let textNodeFromRange = (container) => {
      if (container.nodeType === TEXT_NODE) return container;
      for (let i = 0; i < container.childNodes.length; i++) {
        if (container.childNodes[i].nodeType === TEXT_NODE) return container.childNodes[i];
    }
  }
  , startTextNode = textNodeFromRange(range.startContainer)
  , endTextNode = textNodeFromRange(range.endContainer)
  ;

  let node, indStartTextNode, indEndTextNode, ind = 0, textNodes = []
  ,   it = document.createNodeIterator($scope, SHOW_TEXT);
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

  // get the offset without taking white space into account
  let trimmedOffset = (nodes, index, rangeOffset, anchorNode) => {
      let baseOffset = nodes.slice(0, index).reduce(function (a, b) {
        return a + b.textContent.trim().length;
      }, 0);
      // we subtract the effect of having trimmed the textContent
      if (rangeOffset !== undefined) {
        baseOffset += rangeOffset - (anchorNode.textContent.length -
                                     anchorNode.textContent.replace(/^\s+/, '').length);
      }
      return Math.max(0, baseOffset);
    }
  , startOffset = trimmedOffset(textNodes, indStartTextNode, range.startOffset, startTextNode)
  , endOffset = trimmedOffset(textNodes, indEndTextNode, range.endOffset, endTextNode)
  ;

  return { startOffset: startOffset, endOffset: endOffset };
}

// given a range and a scope, returns a data structure with all the details needed to reconstruct it
export function serializeRange (range, $scope) {
  let $scope = $scope || getScope(range);
  if (!$scope) return;

  let offsets = getOffsets(range, $scope);

  return {
    $scope: $scope,
    sha1: createHash($scope),
    key: createKey($scope),
    startOffset: offsets.startOffset,
    endOffset: offsets.endOffset,
    text: range.toString().trim()
  };
}

// serialise the selection as a range
export function serializeSelection () {
  let selection = window.getSelection();
  if (!selection.isCollapsed) return serializeRange(selection.getRangeAt(0));
}

// given a scope and start/end offsets that ignore white space, returns a range that takes the
// white space into account and captures that content
export function rangeFromOffsets ($scope, startOffset, endOffset) {
  let node
  ,   it = document.createNodeIterator($scope, SHOW_TEXT)
  ,   acc = 0
  ,   startNode, endNode, relStartOffset, relEndOffset
  ;

  while (node = it.nextNode()) {
    let textContent = node.textContent.trim();
    if (relStartOffset === undefined && ((acc + textContent.length) >= startOffset)) {
      startNode = node;
      // we add back the effect of having trimmed the textContent
      relStartOffset = Math.max(0, startOffset - acc + (startNode.textContent.length - startNode.textContent.replace(/^\s+/, '').length));
    }
    if (relEndOffset === undefined && ((acc + textContent.length) >= endOffset)) {
      endNode = node;
      // ditto
      relEndOffset = Math.max(0, endOffset - acc + (endNode.textContent.length - endNode.textContent.replace(/^\s+/, '').length));
      break;
    }
    acc += textContent.length;
  }

  var range = document.createRange();
  range.setStart(startNode, relStartOffset);
  range.setEnd(endNode, relEndOffset);

  return range;
};

// given a target key and a list of candidates, find either an exact match, or one with the smallest
// Levenshtein edit distance. If no candidate has an edit distance less than three, the match is
// undefined.
export function findKey (target, candidates) {
  let x = { index: undefined, value: undefined, lev: undefined };

  for (let i = 0; i < candidates.length; i++) {
    if (target === candidates[i]) {
      return { index: i, value: candidates[i], lev: 0 };
    }
    // look for 1st closest Match
    else {
      let ls = levenshtein.get(target.slice(0, 3), candidates[i].slice(0, 3));
      let le = levenshtein.get(target.slice(-3), candidates[i].slice(-3));
      let lev = ls + le;
      if (lev < 3 && ((x.lev === undefined) || (lev < x.lev)) ) {
        x.index = i;
        x.value = candidates[i];
        x.lev = lev;
      }
    }
  }

  return x;
};

// Given a document object, add data-id, data-hash, and data-key to all citeables.
// Only call this if you have control over the document's lifecycle.
export function addIdentifiers ($doc) {
  Array.prototype.forEach.call($doc.body.getElementsByTagName('*'), $el => {
    if (~citeable.indexOf($el.tagName)) {
      $el.setAttribute('data-id', shortid.generate());
      $el.setAttribute('data-hash', createHash($el));
      $el.setAttribute('data-key', createKey($el));
    }
  });
  return $doc;
};

exports.getChildOffsets = function ($parent, $child) {
  var startTextNode;
  if ($child.nodeType === TEXT_NODE) {
    startTextNode = $child;
  } else {
    for (var i = 0; i < $child.childNodes.length; i++) {
      if ($child.childNodes[i].nodeType === TEXT_NODE) {
        startTextNode = $child.childNodes[i];
        break;
      }
    }
  }

  var node, indStartTextNode, ind = 0, textNodes = [];
  var it = document.createNodeIterator($parent, SHOW_TEXT);
  while (node = it.nextNode()) {
    textNodes.push(node);
    if (node === startTextNode) {
      indStartTextNode = ind;
      break;
    }
    ind++;
  }

  var startOffset = textNodes.slice(0, indStartTextNode).reduce(function(a, b) {
    return a + b.textContent.trim().length;
  }, 0);

  var endOffset = textNodes.slice(0, indStartTextNode + 1).reduce(function(a, b) {
    return a + b.textContent.trim().length;
  }, 0);

  return { startOffset: startOffset, endOffset: endOffset };
};

// XXX
//  this method is all kinds of wrong
//  the text is used as regular expression without sanitising
//  need to check that createNodeIterator() normalises text
//  phantom for testing
//  it also does not ignore whitespace and math
exports.getRangesFromText = function ($scope, text) {
  text = text.trim();
  var re = new RegExp(escapeRegex(text), 'gi');
  var textNode;
  var textContent = '';
  var it = document.createNodeIterator($scope, SHOW_TEXT);
  while (textNode = it.nextNode()) {
    textContent += textNode.textContent.trim();
  }

  var result;
  var matchIndexes = [];
  while ((result = re.exec(textContent)) !== null) {
    matchIndexes.push(result.index);
  }

  return matchIndexes.map(function(index) {
    return rangeFromOffsets($scope, index, index + text.length);
  });
};

if (typeof window === 'object') window.WebVerse = exports;
