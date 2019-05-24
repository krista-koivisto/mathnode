/*
 * Mathnode / Main
 *
 * Main script, which gets executed after all the other components have been
 * loaded. This is where initialization of all loaded libraries and modules
 * happens.
 *
 */

// @TODO: Move to server so people can't mess with it
function urlify(str) {
    return str.toLowerCase().replace(/[^a-z]{1,}/g, '-').replace(/[\-]$/, '');
}

MathNode.Session.init();

//MathNode.Interface.page.open("profile");
//setTimeout(() => { MathNode.Interface.page.open("layout-editor"); }, 400);

/************************
Next to do:
-----------
* Evaluate unit conversion (done, needs testing)
* Unit stripping
* Graph needs plenty fixing, especially refresh resetting dimensions and also
  just the graph mouse tracking breaking randomly
* Error popups need to be fixed
* Significant figures auto-detection?
* Evaluate type display (engineering, basic, etc)
************************/
