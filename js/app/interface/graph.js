/*
 * Mathnode / Interface / Graph
 *
 * Create and display a function graph.
 *
 */

 class MathNodeGraph {
     constructor(target, options = {}) {
         this.parent = options.parent;
         this.target = target;
         this.options = options;
         this.lines = 0;

         this.element = this.update(['x = 0']);
         this.svg = this.element.root[0][0];
     }

     setTitle(title) {
         this.options.title = title;
         this.update(this.functions);
     }

     setSize(size) {
         this.options = {...this.options, ...size};
         //const text = this.svg.getElementsByTagName('text')[0];
         //const canvas = this.svg.getElementsByTagName('g')[0];
         //canvas.setAttribute('transform', 'translate(30, 30)');
         this.update();
     }

     update(functions) {
         let fns = [];
         this.functions = functions || this.functions;
         this.functions.map(fn => fns.push({fn: fn, sampler: 'builtIn', graphType: 'polyline'}));

         if (fns.length === 0) {
             fns.push({fn: 'x = 0'});
         }

         // Show lines which are in use
         fns.forEach((line, i) => {
             const lines = document.getElementsByClassName('line-' + i)
             Array.from(lines).map(line => { line.style.display = 'inherit'; });
         });

         // Hide lines which are not in use
         for (var i = this.lines; i >= fns.length; i--) {
             const lines = document.getElementsByClassName('line-' + i)
             Array.from(lines).map(line => { line.style.display = 'none'; });
         }

         if (fns.length > this.lines) this.lines = fns.length;

         return this.element = functionPlot({
             xAxis: { label: 'x-axis' },
             yAxis: { label: 'y-axis' },
             grid: true,
             ...this.options,
             target: this.target,
             data: fns
         });
     }
 }

MathNode.Interface.graph = {
    create: (target, options = {}) => {
        options.parent = MathNode;
        return new MathNodeGraph(target, options);
    }
};
