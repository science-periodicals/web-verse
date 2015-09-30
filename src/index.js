
// inspired by https://github.com/NYTimes/Emphasis

import SparkMD5 from 'spark-md5';
import sbd from 'sbd';
import shortid from 'shortid';
import levenshtein from 'fast-levenshtein';
import escapeRegex from 'escape-regex-string';

const TEXT_NODE = 3;
const SHOW_TEXT = 4;
export let citeable = ['P', 'LI', 'DD', 'DT', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
                       'FIGCAPTION', 'CAPTION', 'ASIDE', 'SECTION', 'ARTICLE', 'BODY', 'DIV', 'MAIN']
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

// create a md5 hash for the trimmed content of the given element
export function createHash ($el) {
  // TODO: textContent.replace(/\s+/g, ' ') ??
  return SparkMD5.hash($el.textContent.trim());
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

// given a range and a scope, returns a data structure with all the details needed to reconstruct it
export function serializeRange (range, $scope = getScope(range)) {
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
  ,   it = document.createNodeIterator($scope, SHOW_TEXT, null, true)
  ,   acc = 0
  ,   startNode, endNode, relStartOffset, relEndOffset
  ;

  // XXX
  // is it all supposed to only work with trimming?
  // this algorithm only works with trimming
  while (node = it.nextNode()) {
    // let textContent = node.textContent.trim();
    let textContent = node.textContent.replace(/\s+/g, '');
    // console.log('textContent', textContent, acc, textContent.length, startOffset);
    if (relStartOffset === undefined && ((acc + textContent.length) >= startOffset)) {
      startNode = node;
      // console.log('startNode', node);
      // we add back the effect of having trimmed the textContent
      relStartOffset = Math.max(0, startOffset - acc + (startNode.textContent.length -
                                                        startNode.textContent.replace(/^\s+/, '').length));
      // console.log('start offset', relStartOffset, startOffset, acc, startNode.textContent.length, startNode.textContent.replace(/^\s+/, '').length);
    }
    if (relEndOffset === undefined && ((acc + textContent.length) >= endOffset)) {
      endNode = node;
      // console.log('endNode', node);
      // ditto
      relEndOffset = Math.max(0, endOffset - acc + (endNode.textContent.length -
                                                    endNode.textContent.replace(/^\s+/, '').length));
      console.log('end offset', relEndOffset, endOffset, acc, endNode.textContent.length, endNode.textContent.replace(/^\s+/, '').length);
      break;
    }
    acc += textContent.length;
  }
  // console.log(relStartOffset, relEndOffset);

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

function textNodeFromNode (container) {
    if (container.nodeType === TEXT_NODE) return container;
    for (let i = 0; i < container.childNodes.length; i++) {
      if (container.childNodes[i].nodeType === TEXT_NODE) return container.childNodes[i];
  }
}

function trimmedLength (nodes, index) {
  return nodes.slice(0, index).reduce(function (a, b) {
    return a + b.textContent.trim().length;
  }, 0);
}

// Given a range and an element scope, return the start and end offsets into the text that ignore
// white space.
export function getOffsets (range, $scope) {
  let startTextNode = textNodeFromNode(range.startContainer)
  ,   endTextNode = textNodeFromNode(range.endContainer)
  ;

  let node, indStartTextNode, indEndTextNode, ind = 0, textNodes = []
  ,   it = document.createNodeIterator($scope, SHOW_TEXT, null, true);
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
      let baseOffset = trimmedLength(nodes, index);
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

export function getChildOffsets ($parent, $child) {
  let startTextNode = textNodeFromNode($child);

  let node, indStartTextNode, ind = 0, textNodes = [];
  let it = document.createNodeIterator($parent, SHOW_TEXT, null, true);
  while (node = it.nextNode()) {
    textNodes.push(node);
    if (node === startTextNode) {
      indStartTextNode = ind;
      break;
    }
    ind++;
  }

  let startOffset = trimmedLength(textNodes, indStartTextNode);
  let endOffset = trimmedLength(textNodes, indStartTextNode + 1);
  return { startOffset: startOffset, endOffset: endOffset };
};

// given a scope and a string, it will find all instances of that string within the
// scope, and use that to create white-space-independent ranges
export function getRangesFromText ($scope, text) {
  // make the text safe to search, but spaces in it need to match \s+
  text = escapeRegex(text.trim()).replace(/\s+/g, '\\s+');
  let re = new RegExp(text, 'gi')
    , tc = $scope.textContent
  ;
  //  We need to get an offset that ignores whitespace, BUT the regex needs to match
  //  if it contains whitespace.
  // So we:
  //  get all match indices while trimming *nothing*;
  //  then, for each index, remove the amount of WS that is *before* it, get the length of the
  //  match (so that any space becomes a match for \s+), and remove the space from the length of the
  //  match
  let result, matchIndexes = [];
  while ((result = re.exec(tc)) !== null) {
    matchIndexes.push({ index: result.index, length: result[0].length - (result[0].match(/\s/g) || []).length });
  }

  return matchIndexes.map(function (match) {
    match.index -= (tc.substr(0, match.index).match(/\s/g) || []).length;
    console.log('numbers are', match.index, match.length);
    return rangeFromOffsets($scope, match.index, match.index + match.length);
  });
};

export function normalizeText (str) {
  return String(str).trim().replace(/\s+/, ' ');
}

if (typeof window === 'object') window.WebVerse = exports;
