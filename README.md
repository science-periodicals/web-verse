# verse

Verse for the web (deep linking). Inspired by
https://github.com/NYTimes/Emphasis but leverages the
[Range interface](https://developer.mozilla.org/en-US/docs/Web/API/Range)
and
[selection object](https://developer.mozilla.org/en-US/docs/Web/API/Selection).

Identify a paragraph by

- Breaking it into Sentences
- Taking first and last Sentences (ok if that's the same)
- taking the first character from the first three words of each sentence

Such identifier has been shown to provide (for articles at least)

- Uniqueness
- Consistency
- Tolerance

From within a paragraph, a region can be referenced by using character
offset.

For instance the word ```sentences``` of the following paragraph

    I am a paragraph with 2 sentences.
    I am the second sentence.

can be referred as:

```IaaIat:25-33```


## Demo

```npm run watch```

open index.html in a browser.
