class MathNodeHTMLObject {
    constructor(options = {}) {
        Object.keys(options.item).map(option => this[option] = options.item[option]);
        this.children = [];
        this.icons = [];
        this.elements = {};
    }

    addIcon(options = {}) {
        this.icons.push(new MathNode.html.Icon({item: {target: this.elements.body, ...options.item}, element: options.element}));
    }

    update() {
    }
};

MathNode.html = {
    Divider: class MathNodeHTMLDivider extends MathNodeHTMLObject {
        constructor(options = {}) {
            super(options);
            this.classes = ['divider', this.direction || 'horizontal'];

            if (options.element && options.element.classes) {
                this.classes.push(...options.element.classes);
                delete options.element.classes;
            }

            this.elements.body = MathNode.html.createElement({type: 'div', innerText: ' ', ...options.item, ...options.element, classes: this.classes});

            this.update();
        }

        addIcon() {
            throw {err: 500, msg: 'Icons cannot be added to dividers.'};
        }

        update() {
            this.elements.body.classList.remove(...this.elements.body.classList);
            this.elements.body.classList.add(...this.classes);
        }
    },
    Icon: class MathNodeHTMLIcon extends MathNodeHTMLObject {
        constructor(options = {}) {
            super(options);
            delete options.item.icon;
            this.classes = [];

            if (options.element && options.element.classes) {
                this.classes.push(...options.element.classes);
                delete options.element.classes;
            }

            this.elements.body = MathNode.html.createElement({type: 'i', ...options.item, ...options.element, classes: ['fas', 'fa-' + MathNode.html.escape(this.icon), ...this.classes]});

            this.update();
        }

        addIcon() {
            throw {err: 500, msg: 'Iconception not allowed. (Icons cannot contain icons.)'};
        }

        set(name) {
            this.icon = name;
            this.update();
        }

        update() {
            this.elements.body.classList.remove(...this.elements.body.classList);
            this.elements.body.classList.add('fas', 'fa-' + MathNode.html.escape(this.icon), ...this.classes);
        }
    },
    Link: class MathNodeHTMLLink extends MathNodeHTMLObject {
        constructor(options = {}) {
            super(options);
            this.text || '';
            this.elements.body = MathNode.html.createElement({type: 'a', innerText: this.text, href: '#', ...options.element});
            if (this.icon) this.addIcon({item: {icon: this.icon}});

            this.update();
        }

        setText(str) {
            this.text = str;
        }

        update() {
            this.elements.body.innerText = this.text;
        }
    },
    Label: class MathNodeHTMLLabel extends MathNodeHTMLObject {
        constructor(options = {}) {
            super(options);
            this.text || '';
            this.elements.body = MathNode.html.createElement({type: 'div', ...options.element});
            this.elements.text = MathNode.html.createElement({type: 'span', innerText: this.text, target: this.elements.body});
            if (this.icon) this.addIcon({item: {icon: this.icon, before: this.elements.text}});

            this.update();
        }

        setText(str) {
            this.text = str;
        }

        update() {
            this.elements.body.innerText = this.text;
        }
    },
    Input: class MathNodeHTMLEditableLabel extends MathNodeHTMLObject {
        constructor(options = {}) {
            super(options);
            this.text = this.value = this.text || this.value || '';
            this.elements.body = MathNode.html.createElement({type: 'input', onchange: this.update.bind(this), value: this.text, ...options.element});
            if (this.icon) this.addIcon({item: {icon: this.icon, before: this.elements.text}});

            this.update();
        }

        setText(str) {
            this.text = str;
        }

        setValue(value) {
            this.text = this.value = value;
        }

        update() {
            this.text = this.value = this.elements.body.value;
            this.elements.body.value = this.text;
        }
    },
    Button: class MathNodeHTMLButton extends MathNodeHTMLObject {
        constructor(options = {}) {
            super(options);
            this.text = this.text || '';
            this.elements.body = MathNode.html.createElement({type: 'div', ...options.element});
            this.elements.text = MathNode.html.createElement({type: 'span', innerText: this.text, target: this.elements.body});
            if (this.icon) this.addIcon({item: {icon: this.icon, before: this.elements.text}});

            this.update();
        }

        setText(str) {
            this.text = str;
        }

        setAction(action) {
            this.action = action;
        }

        update() {
            if (this.text) {
                this.elements.text.style.display = 'inline';
                this.elements.text.innerText = this.text;
            } else {
                this.elements.text.style.display = 'none';
            }

            if (this.action) this.elements.body.onclick = this.action.bind(this.parent);
        }
    },
    ListItem: class MathNodeHTMLListItem {
        constructor(options = {}) {
            if (options.data) this.data = options.data;
            this.children = [];

            Object.keys(options.item).map(option => this[option] = options.item[option]);
            this.element = MathNode.html.createElement({type: 'div', ...options.element});

            this.init();
        }

        init() {
            if (this.draggable === true && this.parent.sortable) {
                this.element.classList.add("list-item", "draggable");
                this.element.addEventListener('pointerdown', this.mouseDown.bind(this));
                document.addEventListener('pointermove', this.mouseMove.bind(this));
                document.addEventListener('pointerup', this.mouseUp.bind(this));
                this.drag = {height: this.element.offsetHeight, width: this.element.offsetWidth, start: {x: -1, y: -1}, started: false};
            }

            this.enabled = true;
            this.update();
        }

        mouseDown(e) {
            this.drag.start = {x: e.x, y: e.y};
            this.drag.started = true;
            this.dragging = false;
            this.element.classList.add('dragging');
        }

        mouseMove(e) {
            if (this.drag.started === true && this.dragging === false) {
                this.dragging = (Math.abs(this.drag.start.x - e.x) >= 10 || Math.abs(this.drag.start.y - e.y) >= 10);
                this.element.dispatchEvent(new CustomEvent('dragstart'), {detail: {item: this}});
            } else if (this.dragging === true) {
                const coords = this.element.getBoundingClientRect();
                const offset = Math.round((coords.top + coords.height / 2 - e.y) / coords.height);

                if (Math.abs(offset) > 0) this.moveTo(this.position - offset);
            }
        }

        mouseUp(e) {
            this.drag.started = false;
            this.element.classList.remove('dragging');

            if (this.dragging) {
                this.dragging = false;
                this.element.dispatchEvent(new CustomEvent('dragfinish'), {detail: {item: this}});
            }
        }

        moveUp() {
            this.moveTo(this.id - 1);
        }

        moveDown() {
            this.moveTo(this.id + 1);
        }

        moveTo(position) {
            this.parent.move(this, position);
        }

        add(items = []) {
            this.element.dispatchEvent(new CustomEvent('add'), {detail: {item: this}});
            if (Array.isArray(items)) {
                items.map(item => { this.children.push(item); item.parent = this; });
            } else {
                this.children.push(items);
                items.parent = this;
            }
        }

        remove() {
            this.element.dispatchEvent(new CustomEvent('remove'), {detail: {item: this}});
            this.parent.remove(this);
        }

        update() {
            if (this.action) this.element.onclick = this.action.bind(this);
            this.enabled ? this.element.removeAttribute('disabled') : this.element.setAttribute('disabled', true);
            this.element.innerHTML = "";
            this.children.map(item => {
                this.element.appendChild(item.elements.body);
                item.update();
            });
        }
    },
    List: class MathNodeHTMLList {
        constructor(options = {}) {
            this.items = [];

            Object.keys(options.list).map(option => this[option] = options.list[option]);
            this.element = MathNode.html.createElement({type: 'div', ...options.element});
            this.enabled = true;

            this.update();
        }

        get(id) {
            return this.items.find(item => item.id === id);
        }

        add(items = []) {
            const added = items.map(item => {
                item.item.id = this.items.length;
                item.item.parent = this;

                const obj = new MathNode.html.ListItem({...item, element: {...item.element, target: this.element}});
                this.items.push(obj);

                return obj;
            });

            this.update();

            return added.length > 1 ? added : added[0];
        }

        move(item, position) {
            const target = this.get(position);
            if (target && target.draggable) { // Can't take an undraggable item's position
                this.items.splice(position, 0, this.items.splice(item.id, 1)[0]);
                this.update();
            }
        }

        getPosition(item) {
            return item.position;
        }

        remove(item) {
            this.items = this.items.filter(child => child.id !== item.id);
            this.update();
        }

        enable() {
            this.enabled = true;
            this.update();
        }

        disable() {
            this.enabled = false;
            this.update();
        }

        update() {
            this.enabled ? this.element.removeAttribute('disabled') : this.element.setAttribute('disabled', true);
            this.element.innerHTML = "";

            this.items.map((item, index) => {
                this.element.appendChild(item.element);
                item.enabled = this.enabled;
                item.id = item.position = index;
                item.update();
            });
        }
    },
    createElement: (options = {}) => {
        const remove = ['type', 'classes', 'target', 'before'];
        const native = ['innerText', 'innerHTML', 'onclick', 'onchange'];
        const elem = document.createElement(options.type || 'div');
        if (options.classes) options.classes.map(c => elem.classList.add(c));
        if (options.target) options.before ? options.target.insertBefore(elem, options.before) : options.target.appendChild(elem);
        if (!options.draggable) elem.setAttribute('draggable', false); // Disable browser element dragging by default

        // Delete already used options
        Object.keys(options).map(option => { if (remove.includes(option)) delete options[option]; });

        // Add native options to the element itself and remove from list after adding
        Object.keys(options).map(option => { if (native.includes(option)) { elem[option] = options[option]; delete options[option]; }});

        // Add the rest of the options to the element as attributes
        Object.keys(options).map(option => elem.setAttribute(option, options[option]));

        return elem;
    },
    escape: (str) => {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
};
