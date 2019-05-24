math.unit.exists = (unit) => {
    // Not the prettiest solution, but MathJS has no other way to test if a unit is known to it
    try { math.unit(unit); } catch (err) {
        return false;
    }

    return true;
}

math._parseUnits = (expression, units = []) => {
    Object.keys(expression).map(key => {
        if (key === 'name' && math.unit.exists(expression[key])) {
            units.push(expression[key]);
        } else if (typeof expression[key] === 'object') {
            units = math._parseUnits(expression[key], units);
        }
    });

    return units;
}

math._parseVariables = (expression, variables = []) => {
    Object.keys(expression).map(key => {
        if (key === 'name' && math[expression[key]] == null && !math.unit.exists(expression[key])) {
            variables.push(expression[key]);
        } else if (typeof expression[key] === 'object') {
            variables = math._parseVariables(expression[key], variables);
        }
    });

    return variables;
};

math._stripUnits = (expression) => {
    Object.keys(expression).map(key => {
        console.log(expression[key]);
        if (typeof expression[key] === 'object' && math.unit.exists(expression[key].name)) {
            expression[key] = {a: 1};
        } else if (typeof expression[key] === 'object') {
            math._stripUnits(expression[key]);
        }
    });

    return expression;
};

math.unit.strip = (expression, doEval = true) => {
    expression = math.parse(expression);
    let clean = '';

    // Get units (Set gets rid of duplicates)
    //const units = [...new Set(math._parseUnits(expression))];

    expression = math._stripUnits(expression);

    /*// Set all units to equal 1 to neutralize them
    units.map(unit => parser.set(unit, 1));

    if (doEval) {
        expression = parser.eval(expression);
    }*/

    //console.log(expression);

    return expression;
}

math.variables = (expression) => {
    return [...new Set(math._parseVariables(math.parse(expression)))];
};

math.unit.getBaseType = (unit) => {
    if (unit.equalBase) {
        if (unit.equalBase(math.unit('1 m'))) return 'distance';
        if (unit.equalBase(math.unit('1 N'))) return 'force';
        if (unit.equalBase(math.unit('1 K'))) return 'temperature';
        if (unit.equalBase(math.unit('1 Pa'))) return 'pressure';
        if (unit.equalBase(math.unit('1 W'))) return 'power';
        if (unit.equalBase(math.unit('1 C'))) return 'electric charge';
        if (unit.equalBase(math.unit('1 V'))) return 'voltage';
        if (unit.equalBase(math.unit('1 F'))) return 'capacitance';
        if (unit.equalBase(math.unit('1 ohm'))) return 'electrical resistance';
        if (unit.equalBase(math.unit('1 S'))) return 'electrical conductance';
        if (unit.equalBase(math.unit('1 Wb'))) return 'magnetic flux';
        if (unit.equalBase(math.unit('1 T'))) return 'magnetic flux density';
        if (unit.equalBase(math.unit('1 H'))) return 'inductance';
        if (unit.equalBase(math.unit('1 lm'))) return 'luminous flux';
        if (unit.equalBase(math.unit('1 lx'))) return 'illuminance';
        if (unit.equalBase(math.unit('1 Bq'))) return 'radioactivity';
        if (unit.equalBase(math.unit('1 Gy'))) return 'absorbed dose (of ionising radiation)';
        if (unit.equalBase(math.unit('1 Sv'))) return 'equivalent dose (of ionising radiation)';
        if (unit.equalBase(math.unit('1 kat'))) return 'catalytic activity';
        if (unit.equalBase(math.unit('1 s'))) return 'time';
        if (unit.equalBase(math.unit('1 cd'))) return 'luminous intensity';
        if (unit.equalBase(math.unit('1 A'))) return 'electric current';
        if (unit.equalBase(math.unit('1 J'))) return 'energy';
        if (unit.equalBase(math.unit('1 kg'))) return 'mass';
        if (unit.equalBase(math.unit('1 mol'))) return 'amount of substance';
        if (unit.equalBase(math.unit('1 Hz'))) return 'frequency';
        if (unit.equalBase(math.unit('1 deg'))) return 'degrees';
        if (unit.equalBase(math.unit('1 dB'))) return 'decibel ratio';
        if (unit.equalBase(math.unit('1 dBm'))) return 'milliwatt decibels';
        if (unit.equalBase(math.unit('1 dBi'))) return 'isotropic decibels';
        if (unit.equalBase(math.unit('1 m^2'))) return 'area';
        if (unit.equalBase(math.unit('1 m^3'))) return 'volume';
        if (unit.equalBase(math.unit('1 m^-1'))) return 'density';
        if (unit.equalBase(math.unit('1 m/s^2'))) return 'acceleration';
        if (unit.equalBase(math.unit('1 m/s'))) return 'speed';
    }

    return 'unknown';
}

math.unit.getUnitType = (expression) => {
    const unit = math.unit(expression);
    let type = math.unit.getBaseType(unit, 1);

    // If we don't know the precise type, break it down into individual parts and name them instead
    if (type === 'unknown') {
        type = '';

        unit.units.map(unit => {
            type += (unit.power < 0) ? 'per ' : ' ';
            type += math.unit.getBaseType(math.unit(unit.unit.name), unit.unit.power);

            if (unit.power > 1 || unit.power < 1) {
                if (Math.abs(unit.power) == 2) type += ' squared';
                if (Math.abs(unit.power) == 3) type += ' cubed';
                if (Math.abs(unit.power) >= 4) type += '^' + Math.abs(unit.power);
            }

            type += ' ';
        });
    }

    return type.trim();
};

function addUnitSuffix(name, forceSuffix = false) {
    const splitName = name.trim().split(/\s/g);
    let word = splitName[splitName.length - 1];
    const sentence = name.substring(0, name.length - (word.length + 1));

    if (word.length && word[word.length - 1].search(/[\*\@]/) > -1) {
        switch(word[word.length - 1]) {
            case '*': word = word.substring(0, word.length - 1); break;
            case '@': word = word.substring(0, word.length - 1) + 'es'; break;
            default:  break;
        }
    } else {
        word += 's';
    }

    if (forceSuffix || !(splitName.length >= 2 && splitName[splitName.length - 2] && (
                            splitName[splitName.length - 2] === 'per' ||
                            splitName[splitName.length - 1].search(/squared|cubed/g) > -1)
                        )) {
        return sentence + ' ' + word;
    } else {
        return name.replace(/[\*\@]/g, '');
    }
}

function getLongPrefix(unit, name) {
    switch (unit.prefix.name) {
        case 'y':  return 'yocto';
        case 'z':  return 'zepto';
        case 'a':  return 'atto';
        case 'f':  return 'femto';
        case 'p':  return 'pico';
        case 'n':  return 'nano';
        case 'µ':  return 'micro';
        case 'm':  return 'milli';
        case 'c':  return 'centi';
        case 'd':  return 'deci';
        // 1 = 1
        case 'da': return 'deca';
        case 'h':  return 'hecto';
        case 'k':  return 'kilo';
        case 'M':  return 'mega';
        case 'G':  return 'giga';
        case 'T':  return 'tera';
        case 'P':  return 'peta';
        case 'E':  return 'exa';
        case 'Z':  return 'zetta';
        case 'Y':  return 'yotta';
        default:   return '';
    }

    return name;
}

math.unit.getLongName = (expression) => {
    let name = '';

    expression.units.map(unit => {
        if (unit.power < 0 && name.length) {
            name = addUnitSuffix(name) + ' per';
        } else if (unit.power < 0 && !name.length) {
            name += 'per';
        }

        name += ' ';
        name += getLongPrefix(unit, name);

        switch (unit.unit.name) {
            case 'm':  name += 'meter'; break;
            case 'mi': name += 'mile'; break;
            case 'in': name += 'inch@'; break;
            case 'ft': name += 'feet*'; break;
            case 'yd': name += 'yard'; break;
            case 'au': name += 'astronomical unit'; break;
            case 'ly': name += 'light-year'; break;
            case 'pc': name += 'parsec'; break;
            case 's':  name += 'second'; break;
            case 'mins':  name += 'minute'; break;
            case 'h':  name += 'hour'; break;
            case 'g':  name += 'gram'; break;
            case 'oz':  name += 'ounce'; break;
            case 'gal':  name += 'gallon'; break;
            case 'st':  name += 'stone'; break;
            case 'erg':  name += 'erg'; break;
            case 'cd':  name += 'candela'; break;
            case 'K':  name += 'kelvin'; break;
            case 'mol':  name += 'mole'; break;
            case 'J':  name += 'joule'; break;
            case 'Hz':  name += 'hertz*'; break;
            case 'rad':  name += 'radian'; break;
            case 'deg':  name += 'degree'; break;
            case 'sr':  name += 'steradian'; break;
            case 'N':  name += 'newton'; break;
            case 'Pa':  name += 'pascal'; break;
            case 'W':  name += 'watt'; break;
            case 'A':  name += 'ampere'; break;
            case 'C':  name += 'coulomb'; break;
            case 'V':  name += 'volt'; break;
            case 'F':  name += 'farad'; break;
            case 'ohm':  name += 'ohm'; break;
            case 'S':  name += 'siemens'; break;
            case 'T':  name += 'tesla'; break;
            case 'deg C':  name += 'degrees Celsius*'; break;
            case 'lm':  name += 'lumen'; break;
            case 'lx':  name += 'lux*'; break;
            case 'Bq':  name += 'becquerel*'; break;
            case 'Gy':  name += 'gray'; break;
            case 'Sv':  name += 'sievert'; break;
            case 'kat':  name += 'katal'; break;
            case 'au':  name += 'astronomical unit'; break;
            case 'ha':  name += 'hectare'; break;
            case 'l':  name += 'liter'; break;
            case 'L':  name += 'liter'; break;
            case 'fl oz':  name += 'fluid ounce'; break;
            case 'Da':  name += 'dalton (atomic mass unit)'; break;
            case 'u':  name += 'atomic mass unit'; break;
            case 'AMU':  name += 'atomic mass unit'; break;
            case 'eV':  name += 'electron volt'; break;
            case 'BTU': name += 'British thermal unit'; break;
            case 'b':  name += 'bit'; break;
            case 'B':  name += 'byte'; break;
            case 'kn':  name += 'knot'; break;
            default: name += unit.unit.name;
        }

        // @TODO: Make "x squared" and "x cubed" "square x" and "cube x" instead
        if (unit.power > 1 || unit.power < 1) {
            if (Math.abs(unit.power) == 2) name = addUnitSuffix(name, true) + ' squared';
            if (Math.abs(unit.power) == 3) name = addUnitSuffix(name, true) + ' cubed';
            if (Math.abs(unit.power) >= 4) name = addUnitSuffix(name, false) + '^' + unit.power;
        }
    });

    // Replace special symbols used to denote English syntax
    return name.replace(/[\*\@\%]/g, '').trim();
}

math.unit.getCompatible = (expression) => {
    const type = math.unit.getBaseType(expression);

    if (type) {
        const compatible = {
            distance: ['m', 'mi', 'in', 'ft', 'yd', 'au', 'ly', 'pc'],
            force: ['N', 'dyn'],
            temperature: ['K', 'degC', 'degF'],
            pressure: ['Pa', 'atm', 'bar', 'torr'],
            'electric charge': ['C', 'A h'],
            voltage: ['V'],
            capacitance: ['F'],
            'electrical resistance': ['ohm'],
            'electrical conductance': ['S'],
            'magnetic flux': ['Wb', 'V s'],
            'magnetic flux density': ['T'],
            inductance: ['H'],
            'luminous flux': ['lm', 'cd * sr'],
            illuminance: ['lx', 'cd * sr * m^-2'],
            radioactivity: ['Bq', 'Hz', 's^-1'],
            'absorbed dose (of ionising radiation)': ['Gy', 'J/kg', 'Sv'],
            'equivalent dose (of ionising radiation)': ['Sv', 'm^2/s^2'],
            'catalytic activity': ['kat'],
            time: ['h', 'mins', 's'],
            'luminous intensity': ['cd'],
            'electric current': ['A'],
            energy: ['J', 'eV', 'erg', 'kcal', 'BTU', 'kW h', 'L atm'],
            mass: ['kg', 'g', 'lbs', 'ton', 'tonne', 'Da', 'u'],
            'amount of substance': ['mol'],
            frequency: ['Hz', 'Bq', 's^-1'],
            degrees: ['deg', 'rad'],
            area: ['ha', 'm^2', 'cm^2', 'mm^2', 'ft^2', 'in^2'],
            power: ['W', 'erg/s', 'hp'],
            speed: ['m/s', 'km/h', 'mi/h', 'kn', 'ft/s'],
            acceleration: ['m/s^2', 'ft/s^2'],
            volume: ['l', 'mL', 'gal', 'oz', 'm^3', 'cm^3', 'in^3', 'yd^3'],
            density: ['kg/m^3', 'kg/L', 'g/mL'],
        };

        if (compatible[type]) {
            return compatible[type].map(unit => {
                return { name: math.unit.getLongName(math.unit(unit)), unit: unit, type: type };
            });
        }
    }

    return [];
};
