// inspired by https://github.com/NYTimes/Emphasis

var sbd = require('sbd'),
    crypto = require('crypto'),
    levenshtein = require('fast-levenshtein');

var elementBlacklist = ['script', 'style', 'noscript'];

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

  var textContents = [];
  (function recursiveWalk(node) {
    if (node) {
      node = node.firstChild;
      while (node != null) {
        if(!isBlacklisted(node.nodeName.toLowerCase())){
          if (node.nodeType == 3) {
            // Text node, do something, eg:
            textContents.push(node.textContent);
          } else if (node.nodeType == 1) {
            recursiveWalk(node);
          }
        }

        node = node.nextSibling;
      }
    }
  })($el);

  var txt = textContents.join(' ').replace(/[^a-z\. ]+/gi, '').trim();

  if (txt && txt.length>1) {
    var lines = sbd.sentences(txt)
      .map(function(x) {return x.trim();})
      .filter(function(x) {return x;});

    if (lines.length) {
      var k = lines[0].match(/\S+/g).slice(0, (len/2));
      for(var o = 1; o < lines.length; o++){
        var last = lines[o].match(/\S+/g).slice(0, (len/2));
        k = k.concat(last);
      }
      var max = (k.length > len) ? len : k.length;

      for (var i=0; i < max; i++) {
        key += k[i].substring(0, 1);
      }
    }
  }

  return key;
};

var createHash = exports.createHash = function($el, algorithm) {
  algorithm = algorithm || 'sha1';
  return crypto.createHash(algorithm).update($el.textContent.trim(), 'utf8').digest('hex'); //TODO textContent.replace(/\s+/g, ' ') ??
};


var getScope = exports.getScope = function(range) {
  var $scope = range.commonAncestorContainer;
  if ($scope.nodeType === Node.TEXT_NODE) {
    $scope = $scope.parentElement; //get closest Element
  }

  // get closest citeable element
  while (isBlacklisted($scope.tagName.toLowerCase())) {
    $scope = $scope.parentElement;
    if ($scope.tagName.toLowerCase() === 'html') {
      return;
    }
  }
  return $scope;
};

var getOffsets = exports.getOffsets = function(range, $scope) {

  var startTextNode, endTextNode;
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    startTextNode = range.startContainer;
  } else {
    for (var i=0; i < range.startContainer.childNodes.length; i++) {
      if (range.startContainer.childNodes[i].nodeType === Node.TEXT_NODE) {
        startTextNode = range.startContainer.childNodes[i];
        break;
      }
    }
  }

  if (range.endContainer.nodeType === Node.TEXT_NODE) {
    endTextNode = range.endContainer;
  } else {
    for (var j=0; j < range.endContainer.childNodes.length; j++) {
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

  return {startOffset: startOffset, endOffset: endOffset};
};


var serializeRange = exports.serializeRange = function(range, $scope) {
  $scope = $scope || getScope(range);
  if (!$scope) return;

  var offsets = getOffsets(range, $scope);

  return {
    $scope: $scope,
    sha1: createHash($scope),
    key: createKey($scope),
    startOffset: offsets.startOffset,
    endOffset: offsets.endOffset,
    text: range.toString().trim()
  };
};

//key:start-end
exports.serializeSelection = function(selection) {
  var range;
  if (!selection.isCollapsed) {
    range = selection.getRangeAt(0);
  } else {
    return;
  }

  return serializeRange(range);
};

var rangeFromOffsets = exports.rangeFromOffsets = function($scope, startOffset, endOffset) {
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

  for (var i=0; i < candidates.length; i++) {
    if (target === candidates[i]) {
      return {index: i, value: candidates[i], lev: 0};
    } else { //look for 1st closest Match
      var ls = levenshtein.get(target.slice(0, 3), candidates[i].slice(0, 3));
      var le = levenshtein.get(target.slice(-3), candidates[i].slice(-3));
      var lev = ls+le;
      if (lev < 3 && ((x.lev === undefined) || (lev < x.lev)) ) {
        x.index = i;
        x.value = candidates[i];
        x.lev = lev;
      }
    }
  }

  return x;
};

var identifier = {
  'key': 'data-key',
  'hash': 'data-hash'
};

exports.setBlacklist = function(blacklist) {
  for (var i = 0; i < blacklist.length; i++) {
    if (typeof blacklist[i] === 'string') {
      blacklist[i] = blacklist[i].toLowerCase();
    }
  }

  elementBlacklist = blacklist;
};

exports.setIdentifier = function(identifierOptions) {
  for (var i in identifier) {
    if (typeof identifierOptions[i] === 'string') {
      identifier[i] = identifierOptions[i];
    }
  }
};

var isBlacklisted = function(tagName) {
  if (elementBlacklist.indexOf(tagName) !== -1) {
    return true;
  }

  for (var i in elementBlacklist) {
    var filter = elementBlacklist[i];
    if (typeof filter === 'object' && filter.test(tagName)) {
      return true;
    }
  }

  return false;
};

exports.addIdentifiers = function($doc) {
  $doc.body.setAttribute(identifier['key'], createKey($doc.body));
  $doc.body.setAttribute(identifier['hash'], createHash($doc.body));

  Array.prototype.forEach.call($doc.body.getElementsByTagName('*'), function($el) {
    if (!isBlacklisted($el.tagName.toLowerCase())) {
      $el.setAttribute(identifier['key'], createKey($el));
      $el.setAttribute(identifier['hash'], createHash($el));
    }
  });
  return $doc;
};

exports.getChildOffsets = function($parent, $child) {
  var startTextNode;
  if ($child.nodeType === Node.TEXT_NODE) {
    startTextNode = $child;
  } else {
    for (var i = 0; i < $child.childNodes.length; i++) {
      if ($child.childNodes[i].nodeType === Node.TEXT_NODE) {
        startTextNode = $child.childNodes[i];
        break;
      }
    }
  }

  var node, indStartTextNode, ind = 0, textNodes = [];
  var it = document.createNodeIterator($parent, NodeFilter.SHOW_TEXT);
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

exports.getSerializationsFromText = function($scope, text) {
  text = text.trim();
  var re = new RegExp(text, 'ig');
  var textNode;
  var textContent = '';
  var it = document.createNodeIterator($scope, NodeFilter.SHOW_TEXT);
  while (textNode = it.nextNode()) {
    textContent += textNode.textContent.trim();
  }

  var result;
  var matchIndexes = [];
  while ((result = re.exec(textContent)) !== null) {
    matchIndexes.push(result.index);
  }

  return matchIndexes.map(function(index) {
    return serializeRange(rangeFromOffsets($scope, index, index + text.length), $scope);
  });
};
