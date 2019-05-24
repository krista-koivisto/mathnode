const tools = require('../tools'),
      bcrypt = require('bcrypt'),
      permissions = require('../permissions');

var pool = null;
const assert = tools.assert;
const tokenLifetime = 14 * tools.timesteps.days;
const setPool = (p) => pool = p;

class User {
    constructor(data) {
        Object.keys(data).map(key => this[key] = data[key]);
    }

    getPermissionLevel(self) {
        var permission = this.type;
        const types = permissions.types;

        if (this.banned)            permission = types.banned;
        else if (this.unverified)   permission = types.unverified;
        else if (self)              permission = types.self;

        return permission;
    }

    getFieldPermission(action, table, onSelf, field) {
        const self = onSelf || (table === 'users' && (field.id && field.id === this.id));
        const permission = field ? permissions.actions[action][table][field] : permissions.actions[action][table];
        return (permission != null && permission !== permissions.types.none && permission.includes(this.getPermissionLevel(self)));
    }

    isSelf(authority) {
        return (authority && authority.id && authority.id.toString() === this.id.toString());
    }

    static async from(data) {
        return new User(data);
    }

    static async find(data) {
        // Only allow constructing a user from these fields
        const allowed = ['email', 'id'];
        const field = Object.keys(data)[0];
        const value = data[field];
        assert(allowed.includes(field), 400, "Attempted to find user by unknown or illegal field '" + field + "'!");

        // Get user data
        const query = "SELECT * FROM users WHERE ??=? LIMIT 1";
        const [result,] = await pool.query(query, [field, value]);

        // Construct if any user data was returned
        if (result && result[0]) {
            return new User(result[0]);
        } else {
            throw {code: 404, msg: "User not found! Maybe they get lost on their way here?"};
        }
    }

    clean(remove = ['pool', 'password']) {
        return Object.filter(this, key => !remove.includes(key));
    }

    // Check whether the user has access to an action on a set of fields
    can(action, table, setSelf = false, fields = null) {
        if (fields) {
            if ((typeof fields).toLowerCase() === 'object' && !Array.isArray(fields)) fields = Object.keys(fields);
            return fields.every(field => this.getFieldPermission(action, table, setSelf, field));
        } else {
            return this.getFieldPermission(action, table, setSelf);
        }
    }

    // Filter out fields and data the user does not have action access to (Object.filter defined in tools.js)
    filter(action, table, setSelf = false, fields = null) {
        return Object.filter(fields, (field, value) => this.getFieldPermission(action, table, setSelf, field));
    }

    async retrievePackages(authority) {
        const query = "SELECT * FROM packages AS p LEFT JOIN user_packages AS up ON p.id = up.package_id WHERE up.id = ? AND p.status >= ?";
        const [results,] = await pool.query(query, [this.id, this.isSelf(authority) ? 0 : 1]); // Only retrieve unpublished for self

        return results;
    }

    async retrieveLayouts() {
        const query = "SELECT l.id AS id, l.name AS name FROM layouts AS l LEFT JOIN user_layouts AS ul ON l.id = ul.layout_id WHERE ul.id = ?";
        const [results,] = await pool.query(query, [this.id]);

        return results;
    }

    async exists(field = 'email') {
        const allowed = ['email', 'id'];
        assert(allowed.includes(field), 400, "Attempted to find user by unknown or illegal field '" + field + "'!");
        const query = "SELECT * FROM users WHERE ?? = ? LIMIT 1";
        const [result,] = await pool.query(query, [field, this[field]]);
        return (result && result[0] && result[0][field] === this[field]);
    }

    async retrieve(things, authority) {
        const results = await Promise.all(things.map(async thing => {
            switch(thing) {
                case 'packages':
                    return await this.retrievePackages(authority);
                    break;
                case 'layouts':
                    return await this.retrieveLayouts();
                    break;
                default:
                    throw {code: 404, msg: "No such user object!"};
                    break;
            }
        }));

        return results;
    }

    async register() {
        assert(!(await this.exists()), 409, "Hmm... Haven't I seen you around here before?");

        const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const query = "INSERT INTO users (name, email, password, type, verified, banned, reg_date) VALUES ?";
        const hash = await bcrypt.hash(this.password, 12);
        const [result,] = await pool.query(query, [[[this.name, this.email, hash, 0, 0, 0, date]]]);

        // Give user the default layout to start with
        if (result && result.insertId) {
            const [layouts,] = await pool.query("INSERT INTO user_layouts (id, layout_id) VALUES (?, 1)", [result.insertId]);
        }

        if (result && layouts) {
            this.password = hash;
            return this.id = result.insertId;
        } else {
            throw {code: 500, msg: "A sad happened trying to create your user account. :( Try again?"};
        }
    }

    // Authenticate by verifyng the user id and token
    async authenticate(token) {
        const date = tools.dateToMySQL(new Date());
        const query = "SELECT id FROM user_tokens WHERE id = ? AND token = ? AND expires > NOW() LIMIT 1";
        const [result,] = await pool.query(query, [this.id, token]);
        return assert(result && result[0] && result[0].id === this.id, 403, "I'm afraid I can't let you do that, Dave. (Authentication failed!)");
    }

    // Sign the user in
    async signin(credentials) {
        const match = await bcrypt.compare(credentials.password, this.password);

        if (match) {
            const update = { last_login: tools.dateToMySQL(new Date()) };
            await pool.query("UPDATE users SET ? WHERE id = ? LIMIT 1", [update, this.id]);

            this.token = await tools.generateToken();
            const expires = tools.dateToMySQL(new Date(Date.now() + tokenLifetime));
            await pool.query("INSERT INTO user_tokens (id, token, expires) VALUES ?", [[[this.id, this.token, expires]]]);

            return this.clean();
        } else {
            throw {code: 403, msg: "Incorrect password!"};
        }
    }

    // Sign out of all locations
    async signout(credentials) {
        await this.authenticate(credentials.token);
        await pool.query("DELETE FROM user_tokens WHERE id = ?", this.id);
    }

    async ban(authority) {
        await this.update(authority, {banned: 1});
    }

    async unban(authority) {
        await this.update(authority, {banned: 0});
    }

    async verify(authority) {
        await this.update(authority, {verified: 1});
    }

    async update(authority, data) {
        // Silently filter out fields and data the authority user does not have access to modify
        const update = authority.filter('modify', 'users', false, data);

        // Only throw a tantrum if no fields are left after filtering
        if (Object.keys(update).length > 0) {
            const [result,] = await pool.query("UPDATE users SET ? WHERE id = ? LIMIT 1", [update, data.id]);
            return assert(result && result.affectedRows > 0, 500, "Well that didn't go as planned! (Updating user)");
        } else {
            throw {code: 403, msg: "You are not allowed to modify that user!"};
        }
    }

    async remove(authority) {
        assert(authority.can('remove', 'users'), 403, "I'm afraid I can't let you do that, Dave. (Not allowed to remove user!)");
        const [result,] = await pool.query("DELETE FROM users WHERE id = ? LIMIT 1", this.id);
        return (result && result.affectedRows > 0);
    }
}

module.exports = {
    setPool: setPool,
    User: User,
};
