//var graph = null;

desktopSettings = {
    size: {width: 10000, height: 10000},
    grid: {
        size: {width: 40, height: 40},
        thickness: 3,
        color: '#dddddd',
        snap: {x: 10, y: 10}
    },
    zoom: 0.6,
};

graphSettings = {
    // Triggers for all nodes in this graph
    on: {
        process: onUpdate,
        nodeselect: onNodeSelect,
        nodedeselect: onNodeDeselect,
        keydown: keyHandler,
    },
    connector: {
        extension: NodeLabConnector,
        id: 'nodelab-connector'
    },
    history: {
        extension: NodeLabHistory,
        size: 32
    },
    components: [GenericComponent, EvaluationComponent, PackageComponent, GraphComponent],
}

function toggleTopBar() {
    topBar = document.getElementById("topbar");
    indicator = document.getElementById("show-hide-topbar");

    if (topBar.classList.contains("show")) {
        sidebarPanel.element.classList.remove("low");
        indicator.classList.add("flip");
        topBar.classList.remove("show");
        topBar.classList.add("hide");
    } else {
        topBar.classList.add("show");
        topBar.classList.remove("hide");
        indicator.classList.remove("flip");
        sidebarPanel.element.classList.add("low");
    }
}

function updateSidebar() {
    if (MathNode.globals.sidebar) {
        MathNode.globals.sidebar.update();
    }
}

function switchDesktop(selected) {
    MathNode.Interface.tabs.tabs.map(tab => {
            tab.desktop.hide();
    });

    selected.desktop.show();
    selected.graph.update();
    updateSidebar();
}

function isDocumentSaved(tab) {
    const history = tab.graph.history.current();
    const state = history ? history.state : 0;

    return tab.saveState === state;
}

function onHistoryChange(e) {
    const saved = isDocumentSaved(this);

    // Update the element style to indicate if changes have been made
    if (saved) {
        this.element.classList.remove("edited");
    } else {
        this.element.classList.add("edited");
    }
}

function removeDesktop(tab) {
    let doClose = isDocumentSaved(tab);

    if (doClose === false) {
        doClose = confirm("Hold on! Your document still has unsaved changes. Do you still want to close it?");
    }

    if (doClose) tab.desktop.remove();

    return doClose;
}

function addDesktop(tab) {
    // Create a new NodeLab desktop as a parent to our graph
    tab.desktop = nodelab.create(NodeLabDesktop, desktopSettings);

    // Create a new graph and assign it to the desktop. It is also possible to assign
    // the graph as a direct parent to the nodelab instance if no desktop is needed.
    tab.graph = nodelab.create(NodeLabGraph, {...graphSettings, parent: tab.desktop});

    // Add an event listener for whenever the history changes so we can keep track
    // of whether the document has been modified since changing or not.
    tab.graph.on("history", onHistoryChange.bind(tab));

    MathNode.Interface.tabs.select(tab.element.id);
}

// Create a new NodeLab instance
nodelab = new NodeLab(document.querySelector('#nodelab'));

// Populate the menu with available components (set in components.js)
MathNode.Interface.menu.main.populate(menuComponents);
MathNode.Interface.layout.update();

// Initialize the viewport
MathNode.Interface.viewport.init('body-background');

// Disable context menu on the nodelab instance
nodelab.on("contextmenu", (e) => {
    e.preventDefault();
});

// Initialize the tabs
MathNode.Interface.tabs.init('user-tabs', {onNew: addDesktop, onSelect: switchDesktop, onClose: removeDesktop});
