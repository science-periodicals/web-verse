(function () {
var cases = [
  {
    desc: 'should find a direct match',
    target: 'abcdef',
    candidates:  ['qwerty', 'asdfgh', 'abcdef'],
    resIndex: 2,
    resValue: 'abcdef',
    resLev: 0
  },
  {
    desc: 'should find no match',
    target: 'abcdef',
    candidates:  ['qwerty', 'asdfgh'],
    resIndex: undefined,
    resValue: undefined,
    resLev: undefined
  },
  {
    desc: 'should find no match: target=3, cands=6',
    target: 'abc',
    candidates:  ['qwerty', 'asdfgh', 'abcdef'],
    resIndex: undefined,
    resValue: undefined,
    resLev: undefined
  },
  {
    desc: 'should find with: target=6, cands=3+one good',
    target: 'abcdef',
    candidates:  ['qwe', 'asd', 'abcdef'],
    resIndex: 2,
    resValue: 'abcdef',
    resLev: 0
  },
  {
    desc: 'should find no match: target=6, cands=3',
    target: 'abcdef',
    candidates:  ['qwe', 'asd', 'abc'],
    resIndex: undefined,
    resValue: undefined,
    resLev: undefined
  },
  {
    desc: 'should find match: target=2, cands=2',
    target: 'ab',
    candidates:  ['ab', 'qwe', 'asd'],
    resIndex: 0,
    resValue: 'ab',
    resLev: 0
  },
  {
    desc: 'should find match: target=1, cands=1',
    target: 'a',
    candidates:  ['ab', 'qwe', 'a'],
    resIndex: 2,
    resValue: 'a',
    resLev: 0
  },
  {
    desc: 'should find match: target=0, cands=0',
    target: '',
    candidates:  ['ab', '', 'a'],
    resIndex: 1,
    resValue: '',
    resLev: 0
  },
  {
    desc: 'should find with lev=1, sizes=6',
    target: 'abcdef',
    candidates:  ['abcdeg', '', 'a'],
    resIndex: 0,
    resValue: 'abcdeg',
    resLev: 1
  },
  {
    desc: 'should find with lev=2, sizes=6',
    target: 'abcdef',
    candidates:  ['axxdeg', 'abcdfg', 'a'],
    resIndex: 1,
    resValue: 'abcdfg',
    resLev: 2
  },
  {
    desc: 'should find with lev=2, sizes=5/6',
    target: 'abcde',
    candidates:  ['abcdef', 'abcdfg', 'a'],
    resIndex: 0,
    resValue: 'abcdef',
    resLev: 2
  },
  {
    desc: 'should find with lev=2, sizes=6/5',
    target: 'abcdef',
    candidates:  ['abcde', 'abcdfg', 'a'],
    resIndex: 0,
    resValue: 'abcde',
    resLev: 2
  },
  {
    desc: 'should find with lev=2, permutation',
    target: 'abcdef',
    candidates:  ['abcdfe', 'abcdfg', 'a'],
    resIndex: 0,
    resValue: 'abcdfe',
    resLev: 2
  },
];
describe('WebVerse findKey', function () {
  cases.forEach(function (c) {
    it(c.desc, function () {
      var res = WebVerse.findKey(c.target, c.candidates);
      assert.equal(res.index, c.resIndex, 'indices match');
      assert.equal(res.value, c.resValue, 'values match');
      assert.equal(res.lev, c.resLev, 'lev distances match');
    });
  });
});
})();
