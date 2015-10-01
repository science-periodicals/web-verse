
// inspired by https://github.com/NYTimes/Emphasis

import SparkMD5 from 'spark-md5';
import sbd from 'sbd';
import shortid from 'shortid';
import levenshtein from 'fast-levenshtein';
import escapeRegex from 'escape-regex-string';

const TEXT_NODE = 3;
const SHOW_TEXT = 4;
// welcome to a world of horrors
// this is here because I don't trust \s to be correct across browsers
// TODO: if we can ascertain that it is reliable enough, or make Babel transforms it correctly with /u
// inline this whole mess
const SPACE = '[ \\f\\n\\r\\t\\v\​\u00a0\\u1680​\\u180e\\u2000-\\u200a​\\u2028\\u2029\\u202f\\u205f​\\u3000\\ufeff]';
const NOT_SPACE = SPACE.replace('[', '[^');
const RE_ONLY_SPACE = new RegExp('^' + SPACE + '+$');
const RE_SPACES = new RegExp(SPACE + '+');
const RE_SPACES_CAPTURE = new RegExp('(' + SPACE + '+)');
const RE_SPACES_GLOBAL = new RegExp(SPACE + '+', 'g');
const RE_SPACE_GLOBAL = new RegExp(SPACE, 'g');
const RE_NOT_SPACES = new RegExp(NOT_SPACE + '+');
const RE_TRIM_LEFT = new RegExp('^' + SPACE + '*');
const RE_TRIM_RIGHT = new RegExp(SPACE + '*$');
const RE_TRIM_LEFT_CAPTURE = new RegExp('^(' + SPACE + '*)');
const RE_TRIM_RIGHT_CAPTURE = new RegExp('(' + SPACE + '*)$');
const RE_TRIM = new RegExp('^' + SPACE + '*|' + SPACE + '*$', 'g');
const leftTrim = (str) => String(str).replace(RE_TRIM_LEFT, '');
const rightTrim = (str) => String(str).replace(RE_TRIM_RIGHT, '');
const trim = (str) => String(str).replace(RE_TRIM, '');
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
  let txt = normalizeText(($el.textContent || '')).replace(/[^\w\. ]+/gui, '');

  if (txt && txt.length > 1) {
    let lines = sbd.sentences(txt).map(x => trim(x)).filter(x => x);
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
  return SparkMD5.hash(normalizeText($el.textContent));
}

// given a range, find the enclosing block element that is part of our whitelist
export function getScope (range) {
  var $scope = range.commonAncestorContainer;
  // get closest Element
  if ($scope.nodeType === TEXT_NODE) $scope = $scope.parentElement;

  // get closest citeable element
  while (!~citeable.indexOf($scope.tagName)) {
    $scope = $scope.parentElement;
    if ($scope.tagName === 'HTML') return;
  }
  return $scope;
}

// given a range and a scope, returns a data structure with all the details needed to reconstruct it
export function serializeRange (range, $scope = getScope(range)) {
  if (!$scope) return;

  let offsets = getOffsets(range, $scope);

  return {
    $scope: $scope,
    hash: createHash($scope),
    key: createKey($scope),
    startOffset: offsets.startOffset,
    endOffset: offsets.endOffset
  };
}

// serialise the selection as a range
export function serializeSelection () {
  let selection = window.getSelection();
  if (!selection.isCollapsed) return serializeRange(selection.getRangeAt(0));
}

// given a scope and normalised start/end offsets that ignore white space, returns a range using the
// raw offsets
export function rangeFromOffsets ($scope, startOffset, endOffset) {
  let node
  ,   it = document.createNodeIterator($scope, SHOW_TEXT, null, true)
  ,   accumulator = 0
  ,   startNode, endNode, relStartOffset, relEndOffset
  ;

  // get the raw offsets, then simply operate only taking that into account
  startOffset = denormalizeOffset(startOffset, $scope.textContent);
  endOffset = denormalizeOffset(endOffset, $scope.textContent);
  while (node = it.nextNode()) {
    let tc = node.textContent;
    if (relStartOffset === undefined && ((accumulator + tc.length) >= startOffset)) {
      startNode = node;
      relStartOffset = startOffset - accumulator;
    }
    if (relEndOffset === undefined && ((accumulator + tc.length) >= endOffset)) {
      endNode = node;
      relEndOffset = endOffset - accumulator;
      break;
    }
    acc += tc.length;
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

function textNodeFromNode (container) {
    if (container.nodeType === TEXT_NODE) return container;
    for (let i = 0; i < container.childNodes.length; i++) {
      if (container.childNodes[i].nodeType === TEXT_NODE) return container.childNodes[i];
  }
}

// Given a range and an element scope, return the start and end offsets into the text that ignore
// white space.
export function getOffsets (range, $scope) {
  let startTextNode = textNodeFromNode(range.startContainer)
  ,   endTextNode = textNodeFromNode(range.endContainer)
  ;

  let node, textNodes = []
  ,   rawStartOffset, rawEndOffset
  ,   it = document.createNodeIterator($scope, SHOW_TEXT, null, true);
  while (node = it.nextNode()) {
    if (node === startTextNode) {
      rawStartOffset = textNodes.map(tn => tn.textContent.length)
                                .reduce((a, b) => { return a + b; }, 0) +
                                range.startOffset
      ;
    }
    if (node === endTextNode) {
      rawEndOffset = textNodes.map(tn => tn.textContent.length)
                              .reduce((a, b) => { return a + b; }, 0) +
                              range.endOffset
      ;
    }
    textNodes.push(node);
    if (rawEndOffset !== undefined) break;
  }
  var txt = textNodes.map(t => t.textContent).join('');
  return { startOffset: normalizeOffset(rawStartOffset, txt), endOffset: normalizeOffset(rawEndOffset, txt) };
}

// get the normalised offsets of the start and end of a given child text node (or element containing
// one)
export function getChildOffsets ($parent, $child) {
  let startTextNode = textNodeFromNode($child);

  let node
  ,   rawStartOffset, rawEndOffset
  ,   textNodes = []
  ,   it = document.createNodeIterator($parent, SHOW_TEXT, null, true);
  while (node = it.nextNode()) {
    if (node === startTextNode) {
      rawStartOffset = textNodes.map(tn => tn.textContent.length)
                                .reduce((a, b) => { return a + b; }, 0)
      ;
      rawEndOffset = rawStartOffset + node.textContent.length;
    }
    textNodes.push(node);
  }
  return { startOffset: normalizeOffset(rawStartOffset, $parent.textContent)
         , endOffset:   normalizeOffset(rawEndOffset, $parent.textContent) };
};

// given a scope and a string, it will find all instances of that string within the
// scope, and use that to create white-space-independent ranges
export function getRangesFromText ($scope, text) {
  // make the text safe to search, but spaces in it need to match \s+
  text = escapeRegex(trim(text)).replace(RE_SPACES_GLOBAL, SPACE + '+');
  let re = new RegExp(text, 'gi')
    , tc = $scope.textContent
  ;
  //  We need to get an offset that ignores whitespace, BUT the regex needs to match
  //  if it contains whitespace.
  // So we:
  //  get all match indices on raw text
  //  map start and end indices to normalised text
  let result, matchIndexes = [];
  while ((result = re.exec(tc)) !== null) {
    matchIndexes.push({ index: result.index, length: result[0].length });
  }

  return matchIndexes.map(function (match) {
    return rangeFromOffsets($scope, normalizeOffset(match.index, tc), normalizeOffset(match.index + match.length, tc));
  });
};

// returns text that has been trimmed and with all white space normalised to space
export function normalizeText (text) {
  return trim(text).replace(RE_SPACES_GLOBAL, ' ');
}

// Takes a raw offset into a raw text and returns the offset of the same character in a normalised
// text.
export function normalizeOffset (rawOffset, rawText) {
  let workText = rawText.substring(0, rawOffset);
  // the length difference once left-trim and space normalisation have happened
  let delta = workText.length - workText.replace(RE_TRIM_LEFT, '').replace(RE_SPACES_GLOBAL, ' ').length;
  return rawOffset - delta;
}

// Takes a normalised offset and a raw text, and returns the corresponding raw offset
export function denormalizeOffset (normOffset, rawText) {
  normOffset = parseInt(normOffset, 10);
  // process the text into blocks that are either:
  //  - simple non-white-space text
  //  - simple white space
  // in each case the block is given a normalised length, which is how long it would be in normal
  // text, and a raw length, which is its actual length. The first and last white space blocks gets
  // normal lengths of 0, others of 1.
  // then for each block, if the normal offset would be in the block we compute it, otherwise we
  // increment our raw and normal offsets and move to the next block
  let leftTrimMatch = rawText.match(RE_TRIM_LEFT_CAPTURE)
    , rightTrimMatch = rawText.match(RE_TRIM_RIGHT_CAPTURE)
  ;
  rawText = trim(rawText);
  let blocks = rawText.split(RE_SPACES_CAPTURE).map(b => {
    return { rawLength: b.length, normalLength: RE_ONLY_SPACE.test(b) ? 1 : b.length };
  });
  blocks.unshift({ rawLength: leftTrimMatch[1].length, normalLength: 0 });
  blocks.push({ rawLength: rightTrimMatch[1].length, normalLength: 0 });

  let rawOffset = 0
    , normalisingOffset = 0
  ;
  for (var i = 0; i < blocks.length; i++) {
    let block = blocks[i];
    if (block.normalLength + normalisingOffset >= normOffset) {
      return rawOffset + (block.rawLength - block.normalLength) + (normOffset - normalisingOffset);
    }
    else {
      rawOffset += block.rawLength;
      normalisingOffset += block.normalLength;
    }
  }
  return rawOffset;
}

if (typeof window === 'object') window.WebVerse = exports;
