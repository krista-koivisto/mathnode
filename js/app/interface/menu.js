/*
 * Mathnode / Interface / Menu
 *
 * Initializing and updating the various menus available throughout Mathnode.
 *
 */

MathNode.Interface.sessionButton = document.getElementById("login-button");
MathNode.Interface.sessionMenu = document.getElementById("menu-session");

MathNode.Interface.menu = {
    item: class MenuItem {
        constructor(options = {}) {
            options.classes = options.classes || ['dropdown', 'item'];
            Object.keys(options).map(key => this[key] = options[key]);
            this.init();
        }

        init() {
            this.element = document.createElement("a");

            this.element.innerText = this.text || 'Item';
            this.element.draggable = false;
            this.element.href = "#";
            if (this.classes) this.classes.map(c => this.element.classList.add(c));
            if (this.onclick) this.element.onclick = this.onclick;
            if (this.data) Object.keys(this.data).map(key => this.element.dataset[key] = this.data[key]);
            if (this.id) this.element.id = this.id;

            if (this.parent) this.parent.appendChild(this.element);
            if (this.children) Object.keys(this.children).map(child => this.element.appendChild(this.children[child]));
        }
    },
    spacer: class MenuSpacer {
        constructor(options = {}) {
            options.classes = options.classes || ['dropdown', 'spacer'];
            Object.keys(options).map(key => this[key] = options[key]);
            this.init();
        }

        init() {
            this.element = document.createElement("div");
            if (this.classes) this.classes.map(c => this.element.classList.add(c));
            if (this.onclick) this.element.onclick = this.onclick;
            if (this.data) Object.keys(this.data).map(key => this.element.dataset[key] = this.data[key]);
            if (this.id) this.element.id = this.id;

            if (this.parent) this.parent.appendChild(this.element);
            if (this.children) Object.keys(this.children).map(child => this.element.appendChild(this.children[child]));
        }
    },
    main: {
        populate: async (components) => {
            const sidebar = document.getElementById('package-menu');
            sidebar.innerHTML = '';

            // Create default menu entry
            new MathNode.Interface.layout.category.item({parent: sidebar, prefix: 'default-', name: 'evaluation', title: 'Evaluation', icon: 'calculator'});

            // Populate menu with default components
            components.map(component => {
                let menu = document.getElementById('default-menu-evaluation');
                name = component.settings.name;

                if (menu != null) {
                    new MathNode.Interface.menu.item({
                        text: name,
                        parent: menu,
                        onclick: (async e => {
                            await MathNode.Interface.tabs.active.graph.addNode(component.component, component.settings);
                            await MathNode.Interface.tabs.active.graph.nodelab.trigger("update");
                        }),
                    });
                } else {
                    throw "Something went wrong while creating menu item for '" + name + "'";
                }
            });
        },
    },

    session: {
        update: () => {
            if (mndb.credentials.token) {
                MathNode.Interface.sessionButton.innerHTML = '<i class="fas fa-id-badge"></i>';
                let items = '<a href="#" onclick="MathNode.Interface.page.open(\'profile\');" class="dropdown item">Settings</a>';
                items += '<a href="#" onclick="MathNode.Interface.session.signout.do();" class="dropdown item">Sign Out</a>';
                MathNode.Interface.sessionMenu.innerHTML = items;
            } else {
                MathNode.Interface.sessionButton.innerHTML = '<i class="fas fa-arrow-alt-circle-right"></i>';
                let items = '<a href="#" onclick="MathNode.Interface.session.signin.show();" class="dropdown item">Sign In</a>';
                items += '<a href="#" onclick="MathNode.Interface.session.register.show();" class="dropdown item disabled">Register</a>';
                MathNode.Interface.sessionMenu.innerHTML = items;
            }
        }
    },

    search: {
        perform: async () => {
            if (searchBar.value.length >= 2) {
                searchResults.style.display = 'block';
                let results = '';

                const data = await mndb.package.search(searchBar.value);

                data.map(result => {
                    results += '<a href="#" onclick="MathNode.Interface.package.load(\''+result.url+'\'); MathNode.Interface.menu.search.hide();" class="dropdown item search-result">' + result.name + '</a>';
                });

                searchResults.innerHTML = results;
            } else {
                searchResults.innerHTML = '';
                searchResults.style.visibility = 'none';
            }
        },
        hide: () => {
            searchResults.innerHTML = '';
            searchResults.style.visibility = 'none';
        }
    },
};

MathNode.Interface.menu.session.update();
