
var hashedHello = '8b1a9953c4611296a827abf8c47804d7'
  , hashedWorld = '7d793037a0760186574b0282f2f435e7'
  , hashedHW = '5eb63bbbe01eeed093cb22bb8f5acdc3'
;
function htmlContent (html) {
  var mains = document.getElementsByTagName('main');
  while (mains.length) document.body.removeChild(mains.item(0));
  var main = document.createElement('main');
  main.innerHTML = html;
  document.body.appendChild(main);
}
