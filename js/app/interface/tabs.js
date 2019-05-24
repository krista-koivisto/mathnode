/*
 * Mathnode / Interface / Tabs
 *
 * Functions for creating and interacting with tabbed documents
 *
 */

class MathNodeTab {
    constructor(parent) {
        this.parent = parent;

        const tabs = this.parent.Interface.tabs;
        const tab = document.createElement('div');
        const text = document.createElement('span');
        const link = document.createElement('a');
        const close = document.createElement('div');

        this.saveState = 0;
        this.title = "New Document";
        this.id = this.parent.Interface.tabs.uid++;
        this.element = tab;
        this.link = link;
        this.text = text;

        this.values = { precision: 0 };

        close.addEventListener('click', (e) => this.parent.Interface.tabs.close(tab.id, e));
        close.innerHTML = '<i class="fas fa-window-close"></i>';
        close.classList.add('close');

        text.innerText = this.title;

        tab.classList.add('footer', 'tab', 'noselect');
        tab.id = "mn-tab-" + this.id;
        tab.dataset.id = this.id;
        tab.appendChild(text);
        tab.appendChild(close);

        link.href = "#";
        link.title = this.title;
        link.addEventListener('click', (e) => this.parent.Interface.tabs.select(tab.id, e));
        link.appendChild(tab);

        tabs.area.appendChild(link);
        tabs.tabs.push(this);

        tabs.onNew(this);
    }

    close() {
        this.link.remove();
    }

    setTitle(title) {
        this.title = title;
        this.text.innerText = title;
        this.element.parentElement.title = title;
        this.graph.savedAs = title;
    }
}

MathNode.Interface.tabs = {
    init: (element, params) => {
        const tabs = MathNode.Interface.tabs;
        tabs.area = (typeof element === "string") ? document.getElementById(element) : element;
        tabs.active = null;
        tabs.tabs = [];
        tabs.uid = 0;

        // Make it horizontally scrollable
        tabs.area.addEventListener('wheel', (e) => {
            tabs.area.parentElement.scrollLeft += (e.deltaY < 0) ? -48 : 48;
        });

        // For overriding events, for example
        Object.keys(params).map(name => {
            MathNode.Interface.tabs[name] = params[name];
        });

        const defaultTab = new MathNodeTab(MathNode);
        MathNode.Interface.tabs.select(defaultTab.element.id);
    },
    onNew: (tab) => {},
    onSelect: (tab) => {},
    onClose: (tab) => { return true; },
    new: () => {
        return new MathNodeTab(MathNode);
    },
    select: (id, e) => {
        const tabs = MathNode.Interface.tabs;

        const selected = tabs.tabs.filter(tab => {
            if (tab.element.id === id) {
                tab.element.classList.add('selected');
            } else {
                tab.element.classList.remove('selected');
            }

            return (tab.element.id === id);
        });

        tabs.active = selected[0];
        tabs.onSelect(selected[0]);

        if (e) e.stopPropagation();
    },
    close: (id, e) => {
        const tabs = MathNode.Interface.tabs;

        // Find the tab to close
        const target = tabs.tabs.find(tab => {
            if (tab.element.id === id) {
                // Let onClose cancel the action if needed
                if (tabs.onClose(tab)) {
                    const index = tabs.tabs.indexOf(tab);
                    const wasActive = (tabs.active.element.id === id);

                    // Close and remove tab
                    tab.close();
                    tabs.tabs.splice(index, 1);

                    // If this was the active tab, select the next tab to the right
                    if (wasActive && tabs.tabs.length > 0) {
                        let selected = tabs.tabs[index];

                        // If this is the final tab in the row, select the new final tab
                        if (index >= tabs.tabs.length) selected = tabs.tabs[tabs.tabs.length - 1];

                        tabs.select(selected.element.id);
                    }

                    return true;
                }
            }
        });

        if (e) e.stopPropagation();
    }
};
