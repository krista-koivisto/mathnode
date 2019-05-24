/*
 * Mathnode / Components
 *
 * Defines components and their behavior. This is the place you're looking for
 * if you want to add nodes with custom behavior not possible through simple
 * functions.
 *
 */

class GenericComponent extends NodeLabComponent {
    constructor(settings = {}){
        settings.name = settings.name || '<unnamed>';
        settings.title = settings.title || {text: settings.name};
        settings.inputs = settings.inputs || settings.in || [];
        settings.outputs = settings.outputs || settings.out || [];
        settings.inputType = settings.inputType || 'any';
        settings.outputType = settings.outputType || 'any';
        settings.function = settings.function || settings.func || ((inputs, outputs, node) => {});
        settings.category = settings.category || settings.cat || 'Unknown';
        settings.size = {width: 300, height: 240};

        super(settings);

        this.onSelect = settings.onSelect || null;
    }

    start() {
        // Add inputs
        this.settings.inputs.map(name => {
            const input = this.addInput({name: name, accepts: this.settings.inputType});
            input.on("change", onChange.bind(this));
            input.on("keydown", onInput.bind(this));
            input.on("connect", onConnect.bind(this));
        });

        // Add outputs
        this.settings.outputs.map(name => {
            this.addOutput({name: name, accepts: this.settings.outputType});
        });

        this.trigger("process");
    }

    process(inputs, outputs) {
        this.settings.function(inputs, outputs, this);
    }
}

class EvaluationComponent extends GenericComponent {
    constructor(settings = {}){
        // Create function call from settings call string
        settings.func = function(inputs, outputs, node) { MathNode.functions[settings.call](inputs, outputs, node); };

        super(settings);
    }

    start() {
        this.settings.processOnSelect = true;

        // Add inputs
        this.settings.inputs.map(name => {
            const input = this.addInput({name: name, accepts: this.settings.inputType});
            input.on("change", onChange.bind(this));
            input.on("keydown", onInput.bind(this));
            input.on("connect", onConnect.bind(this));
            input.setValue = this.setValue.bind(input);
        });

        // Add outputs
        this.settings.outputs.map(name => {
            this.addOutput({name: name, accepts: this.settings.outputType});
        });
    }

    // Override input setValue function (this refers to input)
    setValue(value, params = {}) {
        this.value = this.initialValue = this.textValue = value;
        this.trigger("change", params);
        this.parent.updateInputs();
    }

    // Override the component's regular remove input function
    removeInput(name, params = {}) {
        let input = this.inputs[name];
        input.removeConnections({noProcess: true});
        this.removeChild(input.element);
        delete this.inputs[name];
    }

    updateInputs() {
        try {
            // First input is considered the equation
            let input = this.inputs[Object.keys(this.inputs)[0]];

            // Find all empty variables in the equation
            let variables = math.variables(input.value);

            // Get the names of all current inputs
            let inputs = Object.keys(this.inputs).reduce((names, name) => {
                names.push(name);
                return names;
            }, []);

            // Find changes in variables
            let added = variables.filter(name => !inputs.includes(name));
            let removed = inputs.filter(name => !variables.includes(name));

            // Add and remove inputs accordingly
            added.map(name => this.addInput({name: name, accepts: this.settings.inputType}));
            removed.map(name => { if (name != input.name) { this.removeInput(name, {noProcess: true}); } });

            // Update if need be
            // @TODO: Fix position jump from changed dimensions
            if (added.length || removed.length) {
                this.updateConnections();
                this.updateSockets();
                this.update();
            }
        }
        catch (err) {
            handleError(err);
        }
    }

    process(inputs, outputs) {
        this.updateInputs();
        this.settings.function(inputs, outputs, this);
    }
}

class PackageComponent extends EvaluationComponent {
    constructor(settings = {}){
        // Create function call from settings call string
        settings.func = function(inputs, outputs, node) { MathNode.functions[settings.call](inputs, outputs, node); };

        super(settings);

        this.package = settings.package;
    }
}

class GraphComponent extends GenericComponent {
    constructor(settings = {}){
        super(settings);

        this.colors = [
            'steelblue',
            'red',
            '#05b378', // green
            'orange',
            '#4040e8', // purple
            'yellow',
            'brown',
            'magenta',
            'cyan'
        ];

        this.addColorIndicator(this.inputs['function'].input, this.colors[0]);
    }

    selectProcess() {
        this.trigger("process");
    }

    addColorIndicator(input, color) {
        const indicator = document.createElement('span');
        indicator.classList.add('nodelab', 'color-indicator', 'noselect');
        indicator.style.backgroundColor = color;
        input.parentElement.appendChild(indicator);
        input.style.paddingRight = '32px';
    }

    updateInputs() {
        try {
            const inputs = Object.keys(this.inputs);

            // Find which inputs are in use
            const used = Object.keys(this.inputs).filter(key => {
                const input = this.inputs[key];
                return !(input.value === '0' && input.textValue === '' && input.socket.connections.length === 0);
            });

            // Add input if all are currently used
            if (used.length === inputs.length) {
                const input = this.addInput({name: 'function (' + inputs.length + ')', accepts: this.settings.inputType});
                input.on("change", this.onChange.bind(this));
                input.on("connect", this.updateInputs.bind(this));
                input.on("keydown", onInput.bind(this));

                this.addColorIndicator(input.input, this.colors[used.length]);
                this.updateConnections();
                this.updateSockets();
                this.update();
            }
        }
        catch (err) {
            handleError(err);
        }
    }

    onChange(e) {
        this.updateInputs();
        onChange(e);
    }

    start() {
        // Add inputs
        this.settings.inputs.map(name => {
            const input = this.addInput({name: name, accepts: this.settings.inputType});
            input.on("change", this.onChange.bind(this));
            input.on("connect", this.updateInputs.bind(this));
            input.on("keydown", onInput.bind(this));
        });

        // Add outputs
        this.settings.outputs.map(name => {
            this.addOutput({name: name, accepts: this.settings.outputType});
        });

        this.trigger("process");
        this.on("nodeselect", this.selectProcess.bind(this));
    }

    process(inputs, outputs) {
        this.settings.function(inputs, outputs);
    }
}

// Default menu components
const menuComponents = [
    {component: EvaluationComponent, settings: {
        cat: 'Evaluation',
        name: 'Evaluate',
        in: ['equation'],
        out: ['result'],
        call: 'evaluation',
        output: false,
    }},
    {component: EvaluationComponent, settings: {cat: 'Evaluation', name: 'Output', in: ['equation'], out: ['output'], call: 'genericOutput', output: true}},
    {component: GraphComponent, settings: {cat: 'Evaluation', name: 'Graph', in: ['function'], func: function(ins){ MathNode.functions.graphFunction(ins); }}},
    /*{component: GenericComponent, settings: {
        cat: 'Evaluation',
        name: "Unit Conversion",
        in: ['input'],
        out: ['result'],
        function: (ins, outs, node) => { MathNode.functions.unitConversion(node); },
        onSelect: { load: ['unit-conversion'], function: (node) => { MathNode.functions.unitConversion(node); } },
    }},*/
];
