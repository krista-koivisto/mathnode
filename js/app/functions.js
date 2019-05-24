/*
 * Mathnode / Functions
 *
 * Functions for components. This is the place you're looking for if you want
 * to add nodes with custom behavior. If you're looking for more than just a
 * function, such as event handling, check out Mathnode / Components instead.
 *
 */

MathNode.functions = {
    parseOutput: (output) => {
        return math.parse(output).toString({parenthesis: 'auto', implicit: 'hide'});
    },

    evaluateExpression: (expression, parser = null, toType = null) => {
        const precision = parseInt(MathNode.Interface.tabs.active.values.precision || '0');
        let result = '0';

        if (parser == null) {
            result = math.eval(expression);
        } else {
            result = parser.eval(expression);
        }

        if (toType) {
            result = math.unit(result).toSI().to(toType);
        }

        return math.format(result, {precision: precision}).toString();
    },

    cleanInput: (input, stripUnits = false, stripEval = true) => {
        const value = stripUnits ? math.unit.strip(input, stripEval).toString() : input;
        // Kind of heavy approach but ensures there's nothing Math.js can't handle.
        math.parse(value);
        // Clear comments so they don't comment out the rest of the expression
        return value.replace(/\#.*/g, '');
    },

    genericAction: (inputs, outputs, action) => {
        var func = '';

        try {
            Object.keys(inputs).map(key => {
                func += '(' +  MathNode.functions.cleanInput(inputs[key].value || '0') + ')' + action;
            });

            func = func.slice(0, -1);

            Object.keys(outputs).map(output => {
                outputs[output].value = MathNode.functions.parseOutput(func);
            });
        }
        catch (err) {
            handleError(err);
        }
    },

    genericFunction: (inputs, outputs, action) => {
        var func = action + '(';

        try {
            Object.keys(inputs).map(key => {
                func += MathNode.functions.cleanInput(inputs[key].value || '0') + ', ';
            });

            func = func.slice(0, -2) + ')';

            Object.keys(outputs).map(output => {
                outputs[output].value = MathNode.functions.parseOutput(func);
            });
        }
        catch (err) {
            handleError(err);
        }
    },

    genericOutput: (inputs, outputs) => {
        try {
            const parser = math.parser();
            const numVars = Object.keys(inputs).length - 1;
            let expression = inputs.equation.value.toString();
            let undefinedVars = numVars;
            let parseExpression = "";

            Object.keys(inputs).map(input => {
                if (input !== 'equation') {
                    // Replace variables with their corresponding values
                    var re = new RegExp('\\b'+inputs[input].name+'\\b', "g");
                    if (inputs[input].textValue.length || inputs[input].socket.state === 'connected') {
                        expression = expression.replace(re, '('+MathNode.functions.cleanInput(inputs[input].value.toString())+')');
                        undefinedVars--;
                    }

                    parseExpression += inputs[input].name + ' = ' + inputs[input].value + '; ';
                }
            });

            Object.keys(outputs).map(output => {
                outputs[output].value = MathNode.functions.parseOutput(expression);
            });
        }
        catch (err) {
            handleError(err);
        }
    },

    evaluation: (inputs, outputs, node) => {
        try {
            const parser = math.parser();
            const numVars = Object.keys(inputs).length - 1;
            let expression = inputs.equation.value.toString();
            let undefinedVars = numVars;
            let parseExpression = "";
            let precision = MathNode.globals.precision;

            Object.keys(inputs).map(input => {
                if (input !== 'equation') {
                    // Replace variables with their corresponding values
                    var re = new RegExp('\\b'+inputs[input].name+'\\b', "g");
                    if (inputs[input].textValue.length || inputs[input].socket.state === 'connected') {
                        expression = expression.replace(re, '('+MathNode.functions.cleanInput(inputs[input].value.toString())+')');
                        undefinedVars--;
                    }

                    parseExpression += inputs[input].name + ' = ' + inputs[input].value + '; ';
                }
            });

            Object.keys(outputs).map(output => {
                let toType = MathNode.functions.unitConversion(node, expression);
                parser.eval(parseExpression);
                outputs[output].value = (undefinedVars === 0) ? MathNode.functions.evaluateExpression(expression, parser, toType) : expression;
            });

            updateNodeDetails(node);
        }
        catch (err) {
            handleError(err);
        }
    },

    graphFunction: (inputs) => {
        try {
            let functions = [];

            Object.keys(inputs).map(input => {
                if (!(inputs[input].value === '0' && inputs[input].textValue === '')) functions.push(MathNode.functions.cleanInput(inputs[input].value, true, false));
            });

            functionGraph.update(functions)
        } catch (err) {
            handleError(err);
        }
    },

    setUnitOutput: (node, type) => {
        // Evaluate the input first to get the value itself
        const value = math.eval(MathNode.functions.cleanInput(node.inputs.input.value));

        if (value) {
            try {
                // Create a unit object from the value and convert it
                node.outputs.result.value = math.unit(value).toSI().to(MathNode.functions.cleanInput(type)).toString();
            }
            catch (err) {
                displayError(err.message);
                node.outputs.result.value = node.inputs.input.value;
            }
        }
    },

    unitConversion: (node, value) => {
        try {
            let compatible = [];
            const specials = ['default', 'custom'];
            const dropdown = document.getElementById('available-units');
            const customInput = document.getElementById('custom-unit-type');

            // Only try to add unit options if unit converter is selected
            if (dropdown) {
                let units = MathNode.functions.unitIdentification(value, 'compatible');

                // Clear the dropdown box
                dropdown.innerHTML = '';

                // Add the default option
                if (units && units.length > 0) {
                    units.unshift({name: 'Custom', unit: 'custom', type: 'custom'});
                    units.unshift({name: 'Default', unit: 'default', type: 'default'});
                } else {
                    units = [{name: 'Default', unit: 'default', type: 'default'},
                             {name: 'Custom',  unit: 'custom', type: 'custom'}];
                }

                // Add all compatible units to the converter
                compatible = units.map(unit => {
                    const option = document.createElement('option');
                    option.value = unit.unit;
                    option.innerText = !specials.includes(unit.unit) ? unit.unit + " (" + unit.name + ')' : unit.name;
                    dropdown.appendChild(option);

                    if (node.selectedType && option.value === node.selectedType) option.selected = 'selected';

                    return unit.unit;
                });

                if (dropdown.value === 'custom') {
                    customInput.style.display = 'block';
                    customInput.value = node.customType || '';
                } else {
                    customInput.style.display = 'none';
                }

                if (!customInput.dataset.listening) {
                    customInput.addEventListener('change', async (e) => {
                        customInput.dataset.listening = true;
                        node.customType = customInput.value || '';

                        node.trigger("process");
                    });
                }

                if (!dropdown.dataset.listening) {
                    dropdown.dataset.listening = true;

                    // Listen for changes in the dropdown menu and update the output when they happen
                    dropdown.addEventListener('change', async (e) => {
                        try {
                            if (dropdown.value !== 'default') {
                                node.selectedType = dropdown.value;
                            }

                            node.trigger("process");
                        }
                        catch (err) {
                            handleError(err);
                        }
                    });
                }
            }

            const isCompatible = !specials.includes(node.selectedType) && compatible.includes(node.selectedType);
            const isCustom = node.selectedType === 'custom';

            // Update output value
            if ((node.selectedType && isCompatible) || isCustom) {
                const finalType = (node.selectedType !== 'custom') ? node.selectedType : node.customType;
                return finalType ? MathNode.functions.cleanInput(finalType) : null;
            } else {
                return null;
            }
        }
        catch (err) {
            handleError(err);
        }
    },

    unitIdentification: (expression, what) => {
        try {
            if (what === 'type') {
                return math.unit.getUnitType(math.eval(expression));
            } else if (what === 'unit') {
                return math.unit.getBaseType(math.eval(expression));
            } else if (what === 'compatible') {
                return math.unit.getCompatible(math.eval(expression));
            } else {
                return math.unit.getLongName(math.unit(math.eval(expression)));
            }
        }
        catch (err) {
            handleError(err);
        }
    },
}
