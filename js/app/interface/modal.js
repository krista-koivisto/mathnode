/*
 * Mathnode / Interface / Modal
 *
 * Functions for displaying and hiding the modal window. (Yes, there is only
 * one.)
 *
 */

MathNode.Interface.dialogBox = document.getElementById("fullscreen-dialog");

MathNode.Interface.modal = {
    show: (body) => {
        MathNode.Interface.dialogBox.style.display = 'block';
        // Changing from none to block breaks transition animation, thus this hack :(
        setTimeout(() => {
            MathNode.Interface.dialogBox.classList.remove('hidden');
            MathNode.Interface.dialogBox.classList.add('visible');
        }, 5);

        MathNode.Interface.dialogBox.innerHTML = body;
    },
    hide: () => {
        MathNode.Interface.dialogBox.classList.add('hidden');
        MathNode.Interface.dialogBox.classList.remove('visible');
        setTimeout(() => {MathNode.Interface.dialogBox.style.display = 'none';}, 150);
        MathNode.Interface.tabs.active.graph.element.focus();
    },
};
