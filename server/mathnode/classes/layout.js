const users = require('./user'),
      packs = require('./package'),
      tools = require('../tools');

var pool = null;
const assert = tools.assert;
const setPool = (p) => pool = p;

class Layout {
    constructor(data) {
        Object.keys(data).map(key => this[key] = data[key]);
    }

    static async from(data, credentials) {
        const layout = new Layout(data);

        // Get id from name and user id if possible
        if (!layout.id && layout.name && credentials.id) {
            const [result,] = await pool.query("SELECT id FROM layouts WHERE name = ? AND user_id = ? LIMIT 1", [layout.name, credentials.id]);

            if (result && result[0] && result[0].id) {
                layout.id = result[0].id;
            }
        }

        return layout;
    }

    static parseQuery(data, allowed = ['id', 'name']) {
        const field = Object.keys(data)[0];
        const value = data[field];
        assert(allowed.includes(field), 400, "Unknown or illegal field '" + field + "'!");

        return [field, value];
    }

    static async search(data) {
        const [field, value] = this.parseQuery(data);
        const query = "SELECT * FROM layouts WHERE MATCH(??) AGAINST(?" + ((value.length < 4) ? " IN BOOLEAN MODE)" : ')') + ' LIMIT 8';
        const [results,] = await pool.query(query, [field, value]);
        return results;
    }

    static async get(data) {
        const [field, value] = this.parseQuery(data);
        let layout = [];
        let packages = [];
        let categories = [];
        let query = "SELECT * FROM layouts WHERE ?? = ? LIMIT 1";
        [layout,] = await pool.query(query, [field, value]);

        if (layout && layout[0] && layout[0].id) {
            [categories,] = await pool.query("SELECT * FROM layout_categories WHERE layout_id = ? ORDER BY position", [layout[0].id]);
            [packages,] = await pool.query("SELECT * FROM layout_packages WHERE layout_id = ? ORDER BY position", [layout[0].id]);
        }

        // Construct from layout data if any was returned
        if (layout.length) {
            return new Layout({id: layout[0].id, name: layout[0].name, categories: { ...categories }, packages: { ...packages }});
        } else {
            throw {code: 404, msg: "Layout not found! :("};
        }
    }

    static async exists(data) {
        const [field, value] = this.parseQuery(data);
        const query = "SELECT * FROM layouts WHERE ?? = ? LIMIT 1";
        const [result,] = await pool.query(query, [field, value]);
        return (result && result[0] && result[0][field] === value);
    }

    async update(data, credentials) {
        if (this.id != 1) {
            const user = await users.User.find({id: credentials.id});

            // Filter out any fields the user is not allowed modify
            const update = user.filter('modify', 'layouts', (await this.madeby() === user.id), data);

            if (Object.keys(update).length) {
                // Remove old categories and packages
                await pool.query("DELETE FROM layout_packages WHERE layout_id = ?", this.id);
                await pool.query("DELETE FROM layout_categories WHERE layout_id = ?", this.id);

                // Add new categories packages
                await Promise.all(Object.keys(this.categories).map(async cat => this.insertCategory(this.categories[cat])));

                return this.id;
            } else {
                throw {code: 403, msg: "You are not allowed to modify that!"};
            }
        } else {
            throw {code: 403, msg: "Modifying the default layout is not allowed!"};
        }
    }

    async insertPackages(categoryId, packages) {
        if (this.id && this.id !== 1) {
            let pkgs = [];

            packages.map(pkg => {
                pkgs.push([this.id, categoryId, pkg.url, pkg.name, pkg.position]);
            });

            if (pkgs.length) await pool.query("INSERT INTO layout_packages (layout_id, category_id, url, name, position) VALUES ?", [pkgs]);
        } else if (this.id === 1) {
            throw {code: 403, msg: "Modifying the default layout is not allowed!"};
        } else {
            throw {code: 404, msg: "Layout not found!"};
        }
    }

    async insertCategory(cat) {
        if (this.id && this.id !== 1) {
            const catQuery = "INSERT INTO layout_categories (layout_id, name, icon, position) VALUES ?";

            // Add category
            const [category,] = await pool.query(catQuery, [[[this.id, cat.name, cat.icon, cat.position]]]);

            // Add category packages
            await this.insertPackages(category.insertId, cat.packages);

            return category.insertId;
        } else if (this.id === 1) {
            throw {code: 403, msg: "Modifying the default layout is not allowed!"};
        } else {
            throw {code: 404, msg: "Layout not found!"};
        }
    }

    async create(credentials) {
        const layoutQuery = "INSERT INTO layouts (name, user_id) VALUES ?";
        const userQuery = "INSERT INTO user_layouts (id, layout_id) VALUES ?";

        // Get the user in order to verify that they are allowed to create layouts
        const user = await users.User.find({id: credentials.id});

        if (user.can('create', 'layouts', true)) {
            const [layout,] = await pool.query(layoutQuery, [[[this.name, credentials.id]]]);
            const [user,] = await pool.query(userQuery, [[[credentials.id, layout.insertId]]]);
            this.id = layout.insertId;

            // Add categories
            Object.keys(this.categories).map(async cat => this.insertCategory(this.categories[cat]));

            return this.id;
        } else {
            throw {code: 403, msg: "You are not allowed to create layouts!"};
        }
    }

    async madeby() {
        if (this.user_id) return this.user_id;

        if (this.id) {
            const query = "SELECT user_id FROM layouts WHERE id = ? LIMIT 1";
            const [result,] = await pool.query(query, this.id);
            if (result && result[0] && result[0].user_id) {
                this.user_id = result[0].user_id;
                return this.user_id;
            } else {
                throw {code: 404, msg: "Layout creator not found!"};
            }
        } else {
            return null;
        }
    }

    async remove(credentials) {
        if (this.id != 1) {
            const user = await users.User.find({id: credentials.id});

            if (user.can('remove', 'layouts', (await this.madeby() === user.id))) {
                const [result,] = await pool.query("DELETE FROM layouts WHERE id = ? LIMIT 1", this.id);
                await pool.query("DELETE FROM layout_packages WHERE layout_id = ?", this.id);
                await pool.query("DELETE FROM layout_categories WHERE layout_id = ?", this.id);
                await pool.query("DELETE FROM user_layouts WHERE layout_id = ? LIMIT 1", this.id); // Remove from all users using this layout
                return (result && result.affectedRows > 0);
            } else {
                throw {code: 403, msg: "You are not allowed to remove that!"};
            }
        } else {
            throw {code: 403, msg: "Removing default configuration is not allowed!"};
        }
    }

    async removePackage(query, credentials) {
        if (this.id !== 1) {
            if (query.id && query.package) {
                const user = await users.User.find({id: credentials.id});

                if (user.can('remove', 'layouts', (await this.madeby() === user.id))) {
                    const [result,] = await pool.query("DELETE FROM layout_packages WHERE id = ? LIMIT 1", query.package);
                    return (result && result.affectedRows > 0);
                } else {
                    throw {code: 403, msg: "You are not allowed to remove that!"};
                }
            } else {
                throw {code: 400, msg: "Insufficient information to remove package!"};
            }
        } else {
            throw {code: 403, msg: "Removing packages from the default configuration is not allowed!"};
        }
    }

    async addPackage(query, credentials) {
        const pkg = await packs.Package.find({id: query.package}, credentials);

        if (pkg) {
            await this.insertPackages(query.category, [{url: pkg.url, name: pkg.name, position: query.position}]);
        }
    }

    async save(data, credentials) {
        if (this.id) {
            return await this.update(data, credentials);
        } else {
            return await this.create(credentials);
        }
    }
}

module.exports = {
    setPool: setPool,
    Layout: Layout,
};
