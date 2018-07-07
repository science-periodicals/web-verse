# Web Verse

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Web Verse enables deep-linking into HTML text, without requiring specific coöperation from the
content (such as adding `id` attributes everywhere). It can be used to generate locator keys for
content inside of a page that are reasonably resilient to markup modifications as well as to edits
to the text itself. As such, it can be used to build an annotation system for text that is likely
to be edited over time. Obviously it is not
[altogether unstoppable][no-power-in-the-verse] but it offers good enough resilience to
be used in production systems.

It was inspired by [Emphasis][nyt] by Michael Donohoe and [Ted Nelson parallel markup](https://www.xml.com/pub/a/w3j/s3.nelson.html), but leverages the [Range interface][ranges]
and [selection object][selections].

We do not provide direct support for instance for mapping a URL's hash containing a Web Verse key
into a specific paragraph or the such. Rather, the expectation is that one can build one's own
preferred annotation system (or more generally deep, resilient linking system) very easily on top
of Web Verse.

We fingerprint a block-level element (e.g. a paragraph) by:

1. Normalising the text to abstract away from markup and formatting differences.

2. Breaking the text into sentences. We attempt to be smart about handling full-stops. We'll ignore
   things like "Dr. Who" and a number of similar cases. It is generally enough to avoid getting
   single word nonsense for our sentences.
3. Taking the first and last sentences. It's OK if the first and last sentences are the same, the
   key is still meaningful.
4. Taking the first character from the first three words of each sentence. Words are defined as
   tokens composed of a run of non-white-space characters.

These fingerprints [have been shown][jsconf] to provide reasonable uniqueness for reasonably-sized
documents. Since it's deterministic yet not dependent on all the content, this method is tolerant to
smaller changes in the content. Furthermore, finding keys can take edit-distance into account, which
enables additional resilience to change.

Regions of text more specific than a block-level element can be referenced from within a block using
character ranges. For instance, in the following paragraph:

<code>
`I` `a`m `a` paragraph with 2 **sentences**.
`I` `a`m `t`he second sentence.
</code>

We can refer to the word `sentences` in the first sentence by using the range, `24-33`. Altogether
with the paragraph's fingerprint, this gives us an address selecting just that word of
`IaaIat:25-33`. (Note that the text offsets are zero-based, and apply to normalised text.)

## Installation

`npm install web-verse`

### In the browser

This is primarily a client-side library (~7k minizipped), just include the `web-verse.min.js` script
that comes with the distribution.

### In Node

Web Verse works with Node, but you have to bring your own DOM. Currently, the best option is likely
to be `jsdom`, but it has limitations due to it not supporting `Range`s.

The following subset of methods works with Node and `jsdom`:

* `createKey()`
* `createHash()`
* `getScope()`, but only with a `node` argument
* `serializeNode()`
* `findKey()`
* `getChildOffsets()`
* `normalizeText()`
* `normalizeOffset()`
* `denormalizeOffset()`

These should normally be more than enough to carry out the sort of operations that you are likely to
want to do on the server (as opposed to, say, getting the user's selection and producing a link from
it).

## API

When loaded in a Web context, Web Verse exposes itself as a global `WebVerse` object, on which the
following methods are available.

### `key = WebVerse.createKey($el)`

Given an element, returns a 6-char key that summarises it for the purposes of deep, resilient
linking.

### `result = WebVerse.findKey(targetKey, candidateKeys)`

Given a key that is being searched for, and a list of candidate keys (for instance, all the keys for
block elements in the document), this will return the best match it can find.

The returned object has fields for `index` (the index in `candidateKeys` that best matched), `value`
(the value that actually matched, which may differ slightly from the `targetKey`), and `lev` (an
indication of the Levenshtein edit distance of the match). If no match was found, all of those
fields will be `undefined`.

The match works by first attempting an exact match, then by choosing the candidate with the smallest
edit distance. No edit distance can be greater than or equal to 3.

### `hash = WebVerse.createHash($el)`

Given an element, it will return a hash for it that is invariant to numerous markup changes inside
of it, looking only at its normalised text content. Such a hash can also be used to generate
resilient identifiers.

### `details = WebVerse.serializeRange(range, $el)`

Given a range and optionally a scoping element (which defaults to `getScope(range)`), it will return
the details one needs in order to create a resilient pointer to that range. The returned object
contains:

* `$scope`: The scoping element (which was used for key and hash generation).
* `hash`: The hash of the scoping element, can be used as an ID that is resilient to markup and
  white space changes but not to text edits.
* `key`: The key for the scoping element; can *also* be used as an ID. It is resilient to markup and
  white space changes, as well as to a certain amount of text editing; but it is less unique than
  the `hash`.
* `startOffset`, `endOffset`: The normalised offsets into the text for that range.

So if you were to wish to use the key+offsets fingerpint that is discussed in this README's
introduction in order to obtain a resilient pointer into what a given range captures, you would:

```js
var details = WebVerse.serializeRange(range);
var fingerprint = details. key + ':' + details.startOffset + '-' + details.endOffset;
```

### `details = WebVerse.serializeSelection()`

Returns the same details as `serializeRange()` but for the current selection. If there is no
selection (or if it is collapsed) it returns `undefined`.

### `details = WebVerse.serializeNode($node, $el)`

The same as `serializeRange()` but instead of a `Range` it uses a node, taking its own text content
as the offsets into the given scope. If no scoping `$el` is given, it will use `getScope($node)`.

### `range = WebVerse.rangeFromOffsets($scope, startOffset, endOffset)`

Given a scope and normalised start/end offsets (that you may have stored in a fingerprint), returns
a `range` object suitable to use directly on the DOM (i.e. applying to the raw content).

If you start with a fingerprint such as the `IaaIat:24-33` example you would use the `IaaIat` part
to find the `$scope` (typically with `findKey()`) and then this method using the scope and the
offsets. It returns a `Range` that you could wrap to highlight, etc.

### `ranges = WebVerse.getRangesFromText($el, searchText)`

Given an element to scope the search in, and a string, it will find all instances of that string
(in a normalised, white-space-invariant manner) inside the textual content of that element, and
return an array of `Range` elements pointing into the matches.

This can be used to find an highlight a specific string. Or, for instance, if a user is creating a
link around a given string in a text this can offer the option of linking all other occurrences of
the same string.

Since it returns `Range`s, it can be easily used with [`Range.surroundContents`][surround-contents].

### `WebVerse.citeable`

An array of element `tagName`s (i.e. uppercase) that are considered acceptable scopes (block-level
elements). You can modify this to alter Web Verse's behaviour.

### `text = WebVerse.normalizeText(text)`

Given a string, returns a version normalised according to Web Verse's internal normalising
algorithm. This is essentially `str.trim().replace(/\s+/g, ' ')` but with its behaviour made
resistant to browser vagaries.

### `offset = WebVerse.normalizeOffset(rawOffset, rawText)`

Web Verse hides away a lot of the complexity involved in dealing with normalised text internally but
having to manipulate a DOM that has raw, unnormalised text content (obviously, without changing the
DOM).

This method returns the offset in the normalised text equivalent to the given raw offset into the
unadulterated text. So calling it with `4, ' a  b'` (which has the offset right before the `b`) will
return `2`, since the normalised text is `a b`.

This may seem cryptic, and in many ways it is. You should only need this if you are trying to
manipulate the text in the same manner as Web Verse does, for instance to extend its functionality.

### `offset = WebVerse.denormalizeOffset(normalisedOffset, rawText)`

Does the reverse of the previous one: given a normalised offset and the *raw* text, it will return
the matching raw offset.

### `$element = WebVerse.getScope(range|$node)`

Given a range or a `$node`, will return the closest enclosing element that may scope it (i.e. a
block-level element from `citeable`). This can the range's `commonAncestorContainer` or any of its
parents. If it goes up the tree without finding a valid candidate, it will return `undefined`.

### `details = WebVerse.getOffsets(range, $el)`

Given a range and an element scope, return an object with `startOffset` and `endOffset` that are the
offsets into the normalised text equivalent to that range, for that scope. Mostly of internal use.

### `details = WebVerse.getChildOffsets($parent, $child)`

Same as `getOffsets()` but uses a `$child` text node (or a `$child` element containing text) as
determining the offsets inside a `$parent` element. Returns `startOffset` and `endOffset` fields
being the offsets normalised to the content of the `$parent`.


## Development

The best thing when developing is to `npm run watch`. This will build both Node and browser versions
continuously. It is also a good idea to `npm run test-local`, which will keep the Karma tests
running (just in Chrome, so as not to be too invasive) whenever you make changes.

---
[jsconf]: http://2014.jsconf.eu/speakers/michael-donohoe-deeplink-to-anything-on-the-web.html
[nyt]: https://github.com/NYTimes/Emphasis
[ranges]: https://developer.mozilla.org/en-US/docs/Web/API/Range
[selections]: https://developer.mozilla.org/en-US/docs/Web/API/Selection
[surround-contents]: https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents
[no-power-in-the-verse]: https://youtu.be/uRdbEY_YfV4?t=24s
