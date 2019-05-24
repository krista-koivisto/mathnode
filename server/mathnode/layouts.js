const layout = require('./classes/layout');
const Layout = layout.Layout;
const setPool = layout.setPool;

module.exports = {
    add:    add,
    get:    get,
    save:   save,
    search: search,
    remove: remove,
    update: update,
    setPool: setPool,
};

async function get(id) {
    return await Layout.get({id: id});
}

async function search(query, credentials) {
    return await Layout.search(query, credentials);
}

async function remove(query, credentials) {
    const layout = await Layout.from(query, credentials);

    switch (query.what) {
        case 'layout':
            return await layout.remove(credentials);
        case 'package':
            return await layout.removePackage(query, credentials);
        default: break;
    }
}

async function add(query, credentials) {
    const layout = await Layout.from(query, credentials);

    switch (query.what) {
        case 'package':
            return await layout.addPackage(query, credentials);
        default: break;
    }
}

async function update(data, credentials) {
    const layout = await Layout.from(data, credentials);
    return await layout.update(data, credentials);
}

async function save(data, credentials) {
    const layout = await Layout.from(data, credentials);
    return await layout.save(data, credentials);
}
