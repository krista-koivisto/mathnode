/*
 * Mathnode / Interface / Panel
 *
 * Turn an HTML element into a resizable panel.
 *
 */

class MathNodePanel {
    constructor(element, sides, parent) {
        this.pointerStart = null;
        this.element = element;
        this.constraints = {
            min: {width: 0, height: 0},
            max: {width: 0, height: 0},
            type: 'px',
        };

        this.parent = parent;

        // Allow browser to cache the sidebar HTML code (should only be turned off while developing)
        this.allowCache = true;

        this.areas = [];

        // Make the panel resizable by adding resize borders
        sides.map((side) => {
            side = side.toLowerCase();
            const border = document.createElement('div');
            border.dataset.side = side;
            border.dataset.direction = (side === 'top' || side === 'bottom') ? 'v' : 'h';
            border.classList.add('window-border', 'noselect', side);
            border.addEventListener('pointerdown', this.pointerDown.bind({border: border, panel: this}));
            document.body.addEventListener('pointermove', this.pointerMove.bind({border: border, panel: this}));
            document.body.addEventListener('pointerup',   this.pointerUp.bind({border: border, panel: this}));
            this.element.appendChild(border);
        });

        // Add the internal detail area
        this.document = document.createElement('div');
        this.document.classList.add('mathnode-panel', 'noselect');
        this.element.appendChild(this.document);

        // Add the default details area
        this.details = document.createElement('div');
        this.details.classList.add('mathnode-panel-details', 'noselect');
        this.document.appendChild(this.details);

        this.parent.Interface.page.openInside(this.details, 'details', { allowCache: this.allowCache });
    }

    async load(page) {
        // Add extra details area
        const area = document.createElement('div');
        area.classList.add('mathnode-panel-details', 'noselect');
        this.document.appendChild(area);

        this.areas.push(area);

        await this.parent.Interface.page.openInside(area, page, { allowCache: this.allowCache });
    }

    clear() {
        this.areas.map(area => { area.remove(); });
    }

    onScale(size, e) {
    }

    pointerDown(e) {
        const panel = this.panel.element;
        this.panel.pointerStart = [e.pageX, e.pageY];
        panel.originalSize = {width: panel.offsetWidth, height: panel.offsetHeight};
        this.border.classList.add('dragging');
    }

    pointerMove(e) {
        if (!this.panel.pointerStart) return;

        const panel = this.panel.element;
        const property = (this.border.dataset.direction === 'h') ? 'width' : 'height';
        const original = this.panel.pointerStart[((property === 'width') ? 0 : 1)];
        const offset = ((property === 'width') ? e.pageX : e.pageY) - original;
        const modifier = (this.border.dataset.side === 'left' || this.border.dataset.side === 'top') ? -1 : 1;
        const size = panel.originalSize[property] + (offset * modifier);
        const limits = this.panel.constraints;

        if ((size >= limits.min[property] || !limits.min[property]) && (size <= limits.max[property] || !limits.max[property])) {
            panel.style[property] = size + limits.type;
        }

        this.panel.onScale({width: panel.offsetWidth, height: panel.offsetHeight}, e);
    }

    pointerUp(e) {
        if (!this.panel.pointerStart) return;
        this.panel.pointerStart = null;
        this.border.classList.remove('dragging');
    }

    update() {
    }
}

MathNode.Interface.panel = {
    create: (element, sides) => {
        return new MathNodePanel(element, sides, MathNode);
    }
};
