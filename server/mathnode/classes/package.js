const users = require('./user');
      tools = require('../tools');

var pool = null;
const assert = tools.assert;
const setPool = (p) => pool = p;

class Package {
    constructor(data) {
        Object.keys(data).map(key => this[key] = data[key]);
    }

    static async from(data) {
        const pkg = new Package(data);

        // Get id from url identifier if necessary
        if (!pkg.id && pkg.url) {
            const [result,] = await pool.query("SELECT id FROM packages WHERE url = ? LIMIT 1", pkg.url);
            if (result && result[0] && result[0].id) {
                pkg.id = result[0].id;
            }
        }

        return pkg;
    }

    static parseQuery(data, allowed = ['id', 'name', 'url', 'expression']) {
        const field = Object.keys(data)[0];
        const value = data[field];
        assert(allowed.includes(field), 400, "Unknown or illegal field '" + field + "'!");

        return [field, value];
    }

    static async search(data, credentials) {
        const [field, value] = this.parseQuery(data);
        const query = "SELECT * FROM packages WHERE MATCH(??) AGAINST(?" + ((value.length < 4) ? " WITH QUERY EXPANSION)" : ')') + ' AND (status=1 OR user_id=?) LIMIT 8';
        //const query = "SELECT * FROM packages WHERE MATCH(??) AGAINST(?" + ((value.length < 4) ? " IN BOOLEAN MODE)" : ')') + ' AND (status=1 OR user_id=?) LIMIT 8';
        const [results,] = await pool.query(query, [field, value, credentials.id]);
        return results;
    }

    static async find(data, credentials) {
        const [field, value] = this.parseQuery(data);
        const query = "SELECT * FROM packages AS p LEFT JOIN package_graphs AS pg ON p.id WHERE ?? = ? AND pg.id = p.id AND (status=1 OR user_id=?) LIMIT 1";
        const [result,] = await pool.query(query, [('p.'+field), value, credentials.id]);

        // Construct if any package data was returned
        if (result && result[0]) {
            return new Package(result[0]);
        } else {
            throw {code: 404, msg: "Package not found! :("};
        }
    }

    static async exists(data) {
        const [field, value] = this.parseQuery(data);
        const query = "SELECT * FROM packages WHERE ?? = ? LIMIT 1";
        const [result,] = await pool.query(query, [field, value]);
        return (result && result[0] && result[0][field] === value);
    }

    async update(data, credentials, graph = null) {
        const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const user = await users.User.find({id: credentials.id});
        const isSelf = (await this.madeby() === user.id);

        // Filter out any fields the user is not allowed modify
        const update = user.filter('modify', 'packages', isSelf, { ...data, edit_date: date });

        if (Object.keys(update).length) {
            const [pkg,] = await pool.query("UPDATE packages SET ? WHERE id = ? LIMIT 1", [update, this.id]);
            if (graph != null) await pool.query("UPDATE package_graphs SET ? WHERE id = ? LIMIT 1", [{ graph: graph }, this.id]);
            return pkg[0];
        } else {
            throw {code: 403, msg: "You are not allowed to modify that!"};
        }
    }

    async create(credentials) {
        // Get the user in order to verify that they are allowed to create layouts
        const user = await users.User.find({id: credentials.id});

        if (user.can('create', 'packages', user.isSelf(credentials))) {
            const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const packageQuery = "INSERT INTO packages (name, url, status, expression, user_id, save_date, edit_date) VALUES ?";
            const userQuery = "INSERT INTO user_packages (id, package_id) VALUES ?";
            const graphQuery = "INSERT INTO package_graphs (id, graph) VALUES ?";
            const packageData = [[this.name, this.url, this.status, this.expression, credentials.id, date, date]];

            const [pkg,] = await pool.query(packageQuery, [packageData]);
            const [user,] = await pool.query(userQuery, [[[credentials.id, pkg.insertId]]]);
            const [graph,] = await pool.query(graphQuery, [[[pkg.insertId, this.graph]]]);

            return pkg.insertId;
        } else {
            throw {code: 403, msg: "You are not allowed to create packages!"};
        }
    }

    async madeby() {
        if (this.user_id) return this.user_id;

        if (this.id) {
            const query = "SELECT id FROM user_packages WHERE package_id = ? LIMIT 1";
            const [result,] = await pool.query(query, this.id);
            if (result && result[0] && result[0].id) {
                this.user_id = result[0].id;
                return result[0].id;
            } else {
                throw {code: 404, msg: "Package creator not found!"};
            }
        } else {
            return null;
        }
    }

    async remove(credentials) {
        const user = await users.User.find({id: credentials.id});
        if (user.can('remove', 'packages', (await this.madeby() === user.id))) {
            const [result,] = await pool.query("DELETE FROM packages WHERE id = ? LIMIT 1", this.id);
            await pool.query("DELETE FROM package_graphs WHERE id = ? LIMIT 1", this.id);
            await pool.query("DELETE FROM package_ratings WHERE id = ? LIMIT 1", this.id);
            await pool.query("DELETE FROM user_packages WHERE package_id = ? LIMIT 1", this.id);
            return (result && result.affectedRows > 0);
        } else {
            throw {code: 403, msg: "You are not allowed to remove this package!"};
        }
    }

    async save(data, credentials) {
        if (this.id) {
            return await this.update({expression: data.expression}, credentials, data.graph);
        } else {
            return await this.create(credentials);
        }
    }
}

module.exports = {
    setPool: setPool,
    Package: Package,
};
