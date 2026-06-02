function findElementsByText(text, leafOnly = true) {
  return $("*:contains(" + text + "):not(script):not(style)").filter(function () {
    if (leafOnly) {
      return $(this).children().length === 0;
    }

    return this.innerTex;
  });
}

function replaceText(searchText, replacementText) {
  $("*:contains(" + searchText + "):not(script):not(style)")
    .filter(function () {
      return $(this).children().length === 0;
    })
    .each(function () {
      this.innerHTML = this.innerHTML.replaceAll(searchText, replacementText);
    });
}

$(document).ready(function () {
  $(".animate").removeClass("animate");
});
