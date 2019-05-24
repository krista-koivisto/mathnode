var sidebarPanel = null;
var functionGraph = null;

function createPanel() {
    functionGraph = MathNode.Interface.graph.create('#functiongraph', {width: 250, height: 250});
    sidebarPanel = MathNode.Interface.panel.create(document.getElementById('detailwindow'), ['left']);
    const detailPanel = MathNode.Interface.panel.create(document.getElementById('properties-panel'), ['bottom']);
    const funcs = document.getElementById('functiongraph');
    const padding = 0;

    sidebarPanel.constraints.min.width = 100;
    sidebarPanel.constraints.max.width = 1000;
    detailPanel.constraints.min.height = 100;
    detailPanel.constraints.max.height = 800;

    window.addEventListener('resize', (e) => {
        sidebarPanel.onScale({width: sidebarPanel.element.offsetWidth - padding, height: sidebarPanel.element.offsetHeight - padding});
    });

    detailPanel.update = async () => {
        const graph = MathNode.Interface.tabs.active.graph;

        if (graph.selected.length === 1) {
            await showNodeDetails(graph.selected[0]);
        } else {
            await showGraphDetails(graph);
        }
    }

    MathNode.globals.sidebar = detailPanel;

    // Initialize the graph area of the panel
    sidebarPanel.onScale = (size, e) => {
        MathNode.Interface.viewport.margins = {left: 74, right: size.width, top: 0, bottom: 0};
        MathNode.Interface.viewport.update();

        detailPanel.onScale({width: size.width, height: detailPanel.element.offsetHeight}, e);
    };

    detailPanel.onScale = (size, e) => {
        functionGraph.setSize({ width: size.width - padding, height: sidebarPanel.element.offsetHeight - detailPanel.element.offsetHeight - padding });
        functionGraph.update();
    }

    sidebarPanel.onScale({width: sidebarPanel.element.offsetWidth - padding, height: sidebarPanel.element.offsetHeight - padding});
}

async function latexify(value, target) {
    const element = (typeof target === 'string') ? document.getElementById(target) : target;

    if (value.length < 128) {
        element.innerHTML = value;

        if (value != null) {
            m = math.parse(value);
        } else {
            m = 'undefined';
        }

        element.innerHTML = '$$' + ((m && m.toTex) ? m.toTex({parenthesis: 'auto'}) : 'undefined') + '$$';
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "footer-latex"]);
        MathJax.Hub.getAllJax('footer-latex')[0];
    } else {
        element.innerHTML = value.substr(0, 125) + '...';
    }

    element.dataset.latexValue = value;
}

async function showNodeDetails(node) {
    // No need to reload sidebar if selecting same node again
    const detailPanel = MathNode.globals.sidebar;

    if (detailPanel.selected !== node) {
        detailPanel.selected = node;
        detailPanel.clear();

        // Load basic node information
        await detailPanel.load('node-details');

        const title = document.getElementById('mathnode-panel-title');
        title.innerText = node.name;

        // Execute custom node functions and load custom panels
        if (node.onSelect) {
            await Promise.all(node.onSelect.load.map(async (page) => {await detailPanel.load(page);}));
            if (node.onSelect.function) await node.onSelect.function(node);
        }

        if (node.process) {
            node.trigger("process");
        }
    }

    // Still update if necessary
    updateNodeDetails(node);
}

async function updateNodeDetails(node) {
    // Map values to array first in case there are multiple outputs to display
    const value = Object.keys(node.outputs).map(out => node.outputs[out].value).toString();
    const element = document.getElementById('mathnode-panel-node-value');

    // Update node details if necessary
    if (element && value !== element.dataset.latexValue) {
        latexify(value, element);
    }
}

async function showGraphDetails(graph) {
    const detailPanel = MathNode.globals.sidebar;
    const title = document.getElementById('mathnode-panel-title');

    detailPanel.clear();
    detailPanel.selected = null;

    await detailPanel.load('graph-details');
    if (title) title.innerText = 'Project';
}

createPanel();

// Update the sidebar to focus on the graph by default
showGraphDetails(MathNode.Interface.tabs.active.graph);
