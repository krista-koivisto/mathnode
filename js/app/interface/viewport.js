/*
 * Mathnode / Interface / Viewport
 *
 * Functions for displaying and updating the viewport.
 *
 */

MathNode.Interface.viewport = {
    init: (target) => {
        const element = (typeof target === 'string') ? document.getElementById(target) : target;
        MathNode.Interface.viewport.element = element;
        MathNode.Interface.viewport.margins = { top: 0, right: 0, bottom: 0, left: 74 };

        window.addEventListener('resize', MathNode.Interface.viewport.update);
    },
    update: () => {
        const element = MathNode.Interface.viewport.element;
        const margins = MathNode.Interface.viewport.margins;
        const size = {
            width: document.body.offsetWidth - margins.left - margins.right,
            height: document.body.offsetHeight - margins.top - margins.bottom
        };

        MathNode.Interface.viewport.size = size;
        element.style.width = size.width + 'px';
        element.style.height = size.height + 'px';
    },
};
