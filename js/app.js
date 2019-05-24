/*
 * Mathnode / app.js
 *
 * Loads all JavaScript files to be loaded in order (synchronously). This is the
 * place you're looking for if you want to add scripts to MathNode.
 *
 * Initializes self.
 *
 */

// Create namespace
var MathNode = {
    Interface: {},
    include: async (file, onload = () => {}) => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = file;
        script.async = false;
        script.onload = onload;
        document.body.appendChild(script);
    },

    app: {
        modules: {
            nodelab: [
                'desktop',
                'graph',
                'node',
                'connector',
                'component',
                'history',
                'package',
            ],
            mathjs: [
                'units',
                'extensions'
            ],
            interface: [
                'menu',
                'page',
                'modal',
                'layout',
                'package',
                'viewport',
                'session',
                'panel',
                'graph',
                'tabs',
            ],
        },
        init: async () => {
            const includes = [];
            // Libraries
            includes.push('js/app/core/mndb.js');
            includes.push('js/app/core/session.js');
            includes.push('js/app/interface/interface.js');
            includes.push('js/nodelab/nodelab.js');

            // Library modules
            await MathNode.app.modules.mathjs.map(async (file) => includes.push('js/helpers/' + file + '.math.js'));
            await MathNode.app.modules.nodelab.map(async (file) => includes.push('js/nodelab/' + file + '.nodelab.js'));
            await MathNode.app.modules.interface.map(async (file) => includes.push('js/app/interface/' + file + '.js'));

            // Main app
            includes.push('js/app/globals.js');
            includes.push('js/helpers/html.js');
            includes.push('js/helpers/icons.js');
            includes.push('js/helpers/snarky.js');
            includes.push('js/app/components.js');
            includes.push('js/app/functions.js');
            includes.push('js/app/cookies.js');
            includes.push('js/app/events.js');
            includes.push('js/app/desktop.js');
            includes.push('js/app/sidebar.js');
            includes.push('js/app/main.js');

            await MathNode.app.load(includes);
        },
        load: async (includes) => {
            MathNode.app.loadPercent = (80 / includes.length); // 80, because 20% used for external scripts
            loader.setText('MathNode scripts');
            includes.map(async (file) => {
                await MathNode.include(file, MathNode.app.loaded);
            });
        },
        loaded: async () => {
            loader.increment(MathNode.app.loadPercent);

            if (loader.value > 99.9) {
                loader.hide();
            }
        },
    },
};

MathNode.app.init();
