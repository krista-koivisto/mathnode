/*
 * Mathnode / Interface / Page
 *
 * Loads HTML pages asynchronously with support for <script> tags.
 * Scripts are put in their own unique namespace and cached for future use.
 *
 */
MathNode.Interface.page = {
    load: async (name, allowCache = false) => {
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            const resource = 'pages/' + name;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.responseText);
                    } else {
                        reject({code: xhr.status, body: xhr.responseText});
                    }
                };
            };

            xhr.open('GET', resource, true);

            if (allowCache === false) {
                xhr.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                xhr.setRequestHeader("Pragma", "no-cache");
                xhr.setRequestHeader("Expires", "0");
            }

            xhr.send();
        }).catch(err => console.log(err));
    },
    getNamespace: (name) => {
        // Check if a script for this element has already been created
        const cache = document.getElementById(name+'-page-js');

        // Generate a unique namespace if necessary to avoid global variables leaking into the app itself
        if (!cache) {
            return namespace = 'mnpage_' + Math.random().toString(36).substr(2, 5);
        } else {
            return cache.dataset.namespace;
        }
    },
    loadScripts: (name, namespace, scripts) => {
        const cache = document.getElementById(name+'-page-js');

        if (!cache) {
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.async = false;
            script.dataset.namespace = namespace;

            // Give cache unique page-based name
            script.setAttribute('id', name+'-page-js');

            // Create namespace and define $this and $page
            var code = "MathNode.Interface.page." + namespace + " = { reference: 'MathNode.Interface.page."+namespace+"', init: () => {";
            code += "\r\n\tconst $this = MathNode.Interface.page."+namespace+";\r\n";
            code += "const $page = document.getElementById('page-body');\r\n\r\n";

            // Add actual page code
            scripts.map(source => code += (source + '\r\n'));
            script.innerHTML = code + '}\r\n};\r\n\r\n' + "MathNode.Interface.page." + namespace + '.init();';

            document.body.appendChild(script);
        } else {
            // Re-run the scripts for this page if a cached version is available
            MathNode.Interface.page[namespace].init();
        }
    },
    openInside: async (target, name, settings = {}) => {
        let scripts = [];
        const data = await MathNode.Interface.page.load(name, settings.allowCache || false);
        const namespace = MathNode.Interface.page.getNamespace(name);
        let vars = '// Passed variables:\n';

        // Add passed variables to the top of the script
        if (settings.parent) vars += "const $parent = " + settings.parent.reference + ";\n\n";
        if (settings.variables) Object.keys(settings.variables).map(v => { vars += 'const ' + v + ' = ' + settings.variables[v] + ';\n'; });
        scripts.push(vars+'\n\n');

        // Remove scripts from the source and store them so we can handle them separately
        const source = data.replace(/\<script.*?\>([\s\S]*?)\<\/script\>/ig, (full, script) => {
            scripts.push(script);
            return '';
        });

        // Add non-script assets
        target.innerHTML = source.replace(/\$this\./g, "MathNode.Interface.page['"+namespace+"'].");

        // Add scripts
        MathNode.Interface.page.loadScripts(name, namespace, scripts);
    },
    open: async (name, settings = {}) => {
        let scripts = [];
        const page = document.createElement('div');

        // Load page data
        MathNode.Interface.page.openInside(page, name, settings);

        // Set up default page element
        page.setAttribute('id', 'page-body');
        page.classList.add('page-body');
        page.tabIndex = -1;
        document.body.appendChild(page);

        setTimeout(() => {page.classList.add('show'); page.focus();}, 5);
    },
    close: () => {
        const page = document.getElementById('page-body');
        page.classList.add('hide')
        setTimeout(() => {
            document.body.removeChild(page);
        }, 150);
    }
}
