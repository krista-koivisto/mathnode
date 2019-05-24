/*
 * Mathnode / Interface / Package
 *
 * Modal windows related to saving and loading of packages.
 *
 */

MathNode.Interface.package = {
    load: async (url) => {
        const graph = MathNode.Interface.tabs.active.graph;
        const data = await mndb.package.get(url);

        const settings = {
            ...data,
            internal: {id: data.id, url: data.url},
            user: mndb.credentials,
            graph: data.graph,
            component: {objectType: PackageComponent, settings: {name: data.name}},
            outputType: EvaluationComponent,
            spawner: graph.addNode.bind(graph),
        };

        const pkg = new NodeLabPackage(graph.nodelab, graph, settings);
        return await pkg.spawn();
    },
    save: (name) => {
        if (name) {
            const tab = MathNode.Interface.tabs.active;
            const history = tab.graph.history ? tab.graph.history.current() : null;

            mndb.package.save(name, MathNode.Interface.tabs.active.graph);
            tab.saveState = history ? history.state : 0;
            tab.element.classList.remove("edited");
            tab.setTitle(name);

            MathNode.Interface.modal.hide();
        } else {
            MathNode.Interface.package.saveAs();
        }
    },
    saveAs: () => {
        let title = "<div class='modal-title'>Save Graph</div>";
        let input = "<input class='modal-input' id='save-as-this' autocomplete='off' onkeydown='if (event.key == \"Enter\") MathNode.Interface.package.save(this.value);'/>";
        let button = "<input type='button' class='modal-button' onclick='MathNode.Interface.package.save(document.getElementById(\"save-as-this\").value);' value='Save'/>";
        let body = "<div class='modal-body'>"+input+button+"</div>";
        let modal = "<div class='modal-dialog' onclick='event.stopPropagation();'>"+title+body+"</div>";

        MathNode.Interface.modal.show(modal);
    },
};
