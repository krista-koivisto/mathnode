/*
 * Mathnode / Interface / Layout
 *
 * Initializing and updating layout affected menus.
 *
 */

 class MathNodeLayout {
     constructor(options = {}) {
         Object.keys(options).map(key => this[key] = options[key]);
     }

     simplify(overrides) {
         let position = {};
         let categories = [];
         let categoryMap = {};

         // Get layout categories
         Object.keys(this.categories).map(cat => {
             if (categoryMap[this.categories[cat].id] !== 0 && categoryMap[this.categories[cat].id] == null) {
                 categoryMap[this.categories[cat].id] = categories.length;
                 categories.push({...this.categories[cat], position: cat, packages: []});
                 position[this.categories[cat].id] = 0;
             }
         });

         // Assign packages to categories
         Object.keys(this.packages).map(pkg => {
             const category = categories[categoryMap[this.packages[pkg].category_id]];
             category.packages.push({...this.packages[pkg], position: position[category.id]++});
         });

         // Create simplified object
         const data = {
             name: this.name,
             categories: categories
         }

         // Override passed values
         Object.keys(overrides).map(key => data[key] = overrides[key]);

         return data;
     }

     getSorted() {
         this.sorted = {};

         this.sorted.categories = Object.entries(this.categories)
         .sort((a, b) => a[1].position - b[1].position); // Sort by category position

         this.sorted.packages = Object.entries(this.packages)
         .sort((a, b) => a[1].position - b[1].position); // Sort by package position

         return this.sorted;
     }

     addCategory(name, icon) {
         this.categories[Object.keys(this.categories).length] = { id: -1, layout_id: this.id, name: name, icon: icon };
     }

     async save(name) {
         if (name && name.length > 1 && name.toLowerCase() !== 'default') {
             const data = this.simplify({name: name});
             return await mndb.layout.save(data);
         } else if (name.length < 2) {
             alert("Layout name must be at least 2 letters long");
         } else {
             alert("Ovewriting the default layout is not allowed!");
         }
     }
 }

MathNode.Interface.layout = {
    category: {
        item: class CategoryItem {
            constructor(options = {}) {
                Object.keys(options).map(key => this[key] = options[key]);
                this.init();
            }

            init() {
                const dropdown = document.createElement('div');
                const button = document.createElement('button');
                const tooltip = document.createElement('a');
                const icon = document.createElement('i');
                this.menu = document.createElement('div');

                this.menu.setAttribute('id', (this.prefix || '') + 'menu-' + this.name);
                tooltip.title = this.title;
                dropdown.draggable = false;

                dropdown.classList.add('dropdown');
                button.classList.add('big-button');
                tooltip.classList.add('title');
                icon.classList.add('fas', 'fa-' + this.icon);
                this.menu.classList.add('dropdown-content');

                this.parent.appendChild(dropdown);
                dropdown.appendChild(button);
                button.appendChild(tooltip);
                tooltip.appendChild(icon);
                dropdown.appendChild(this.menu);

                this.iconElement = icon;
            }
        }
    },
    load: async (id) => {
        const sidebar = document.getElementById('package-menu');
        let menu = null;
        let menus = [];

        // Clear sidebar then load default components
        sidebar.innerHTML = '';
        MathNode.Interface.menu.main.populate(menuComponents || []);

        // Get layout data and create layout object from it
        const data = await mndb.layout.get({id: id});
        const layout = new MathNodeLayout(data);
        const sorted = layout.getSorted();
        MathNode.Interface.layout.object = layout;

        // Log unicode entries for layout icons
        MathNode.Interface.layout.category.unicode = {};

        // Create layout elements from layout data
        Object.keys(sorted.categories).map(cat => {
            const category = sorted.categories[cat][1];
            const title = category.name.replace(/[^a-z\-\s]/gi, '');
            const name = category.name.toLowerCase().replace(/[^a-z\-]/g, '');
            const icon = category.icon.toLowerCase().replace(/[^a-z\-]/g, '');

            // Add new category element
            const item = new MathNode.Interface.layout.category.item({parent: sidebar, name: name, title: title, icon: icon});
            menu = item.menu;
            menus.push(category.id);

            // Keep track of icon unicode
            const iconUnicode = window.getComputedStyle(item.iconElement, ':before').content.replace(/'|"/g, '').charCodeAt(0).toString(16).replace(/[^a-z0-9]/gi, '');
            MathNode.Interface.layout.category.unicode[icon] = iconUnicode;

            // Load category packages
            Object.keys(sorted.packages).map(pack => {
                const pkg = sorted.packages[pack][1];

                if (pkg.category_id === category.id) {
                    if (menu) {
                        new MathNode.Interface.menu.item({
                            id: 'mn-layout-package-' + pkg.id,
                            text: pkg.name,
                            parent: menu,
                            onclick: (async (e) => { MathNode.Interface.package.load(pkg.url); }),
                            children: [],
                        });
                    } else {
                        throw "Something went wrong while creating menu item for '" + pkg.name + "'";
                    }
                }
            });
        });

        // Set selected
        MathNode.Interface.layout.selected = id;
        const topMenu = document.getElementById('top-menu-layouts');

        Array.from(topMenu.childNodes).map(child => {
            if (child.id !== 'mn-layout-' + id) {
                child.classList.remove('bold');
            } else {
                child.classList.add('bold');
            }
        });
    },
    update: async () => {
        const loggedIn = !!mndb.credentials.token;
        const menu = document.getElementById('top-menu-layouts');
        const privs = document.getElementsByClassName('dropdown privileged');
        const sidebar = document.getElementById('package-menu');

        // Create default menu components
        MathNode.Interface.menu.main.populate(menuComponents);

        // Clear menus
        menu.innerHTML = '';

        // Create layout switching and saving menu
        if (loggedIn) {
            const layouts = await mndb.user.retrieve({thing: 'layouts', user: mndb.credentials});
            new MathNode.Interface.menu.item({text: 'Save Layout', parent: menu, onclick: (async (e) => { MathNode.Interface.layout.save(layout.name); })});
            new MathNode.Interface.menu.item({text: 'Save Layout As...', parent: menu, onclick: (async (e) => { MathNode.Interface.layout.saveAs(); })});
            new MathNode.Interface.menu.item({text: 'Edit Layouts', parent: menu, onclick: (async (e) => { await MathNode.Interface.layout.editor(); })});
            new MathNode.Interface.menu.spacer({parent: menu});

            MathNode.Interface.layout.list = layouts;

            // Create layout switching items
            layouts.map(layout => {
                new MathNode.Interface.menu.item({
                    id: 'mn-layout-' + layout.id,
                    text: layout.name,
                    parent: menu,
                    onclick: (async (e) => { MathNode.Interface.layout.load(layout.id); }),
                });
            });

            Array.from(privs).map(icon => icon.classList.remove('hidden'));
            MathNode.Interface.layout.load(1);
        } else {
            Array.from(privs).map(icon => icon.classList.add('hidden'));
            MathNode.Interface.layout.load(1);
        }
    },
    reload: async () => {
        await MathNode.Interface.layout.load(MathNode.Interface.layout.object.id);
    },
    removePackage: async (layout, id) => {
        const doRemove = confirm("There's no going back if you do this. Are you sure you want to remove this item from your layout?");

        if (doRemove) {
            await mndb.layout.removePackage(layout, id);
            document.getElementById('mn-layout-package-' + id).remove();
        }

        return doRemove;
    },
    editor: async () => {
        MathNode.Interface.page.open('layout-editor');
    },
    save: async (name) => {
        await MathNode.Interface.layout.object.save(name);
    },
    saveAs: () => {
        let title = "<div class='modal-title'>Save Layout</div>";
        let input = "<input class='modal-input' id='save-as-this' autocomplete='off' onkeydown='if (event.key == \"Enter\") MathNode.Interface.layout.save(this.value);'/>";
        let button = "<input type='button' class='modal-button' onclick='MathNode.Interface.layout.save(document.getElementById(\"save-as-this\").value);' value='Save'/>";
        let body = "<div class='modal-body'>"+input+button+"</div>";
        let modal = "<div class='modal-dialog' onclick='event.stopPropagation();'>"+title+body+"</div>";

        MathNode.Interface.modal.show(modal);
    },
};
