/*
 * Mathnode / Interface / Interface
 *
 * Master interface file.
 *
 * Parses linked interface modules and creates their parent objects under the
 * master Interface object. (e.g. Interface.menu, Interface.modal etc).
 *
 */

MathNode.Interface = MathNode.app.modules.interface.reduce((result, extension) => {result[extension] = {}; return result;}, {});
