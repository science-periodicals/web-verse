# verse

Verses for the web (deep linking text). Inspired by [Emphasis][nyt] by Michael
Donohoe but leverages the [Range interface][ranges] and
[selection object][selections].

We fingerprint a paragraph by

1. Break the text into sentences [1]
2. Take the first and last sentences [2]
3. Take the first character from the first three words of each sentence [3]

These fingerprints [have been shown][jsconf] to provide a uniqueness for
reasonably sized documents. Since it's deterministic yet not dependent on all
content, this method is tolerant to smaller changes in the
content.

Regions of text can be referenced from within a paragraph by using character
ranges (counting from 1). For instance, in the following paragraph:

<code><pre>**I** **a**m **a** paragraph with 2 sentences.
**I** **a**m **t**he second sentence.</pre></code>

We can refer to the word `sentences` in the first sentence by using the range,
`25-33`. Altogether with the paragraph's fingerprint, this gives us an address of
`IaaIat:25-33`.


## Try it!

`npm run watch`

open index.html in a browser.

---

1: We attempt to be smart about handling full-stops. We'll ignore things like
   "Dr. Who" and a few similar cases. It's generally enough to avoid getting
   single word nonsense for our sentences.

2: It's ok if the first and last sentences are the same sentence.

3: Words are defined by tokens composed of a run of non-whitespace characters.

[jsconf]: http://2014.jsconf.eu/speakers/michael-donohoe-deeplink-to-anything-on-the-web.html
[nyt]: https://github.com/NYTimes/
[ranges]: https://developer.mozilla.org/en-US/docs/Web/API/Range
[selections]: https://developer.mozilla.org/en-US/docs/Web/API/Selection
