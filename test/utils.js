
function htmlContent (html) {
  var mains = document.getElementsByTagName('main');
  while (mains.length) document.body.removeChild(mains.item(0));
  var main = document.createElement('main');
  main.innerHTML = html;
  document.body.appendChild(main);
}
