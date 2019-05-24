const package = require('./classes/package');
const Package = package.Package;
const setPool = package.setPool;

module.exports = {
    get:    get,
    save:   save,
    search: search,
    remove: remove,
    update: update,
    setPool: setPool,
};

async function get(query, credentials) {
    return await Package.find(query, credentials);
}

async function search(query, credentials) {
    return await Package.search(query, credentials);
}

async function remove(query, credentials) {
    const pack = await Package.find(query, credentials);
    return await pack.remove(credentials);
}

async function update(data, credentials) {
    const pack = await Package.from(data);
    return await pack.update(data, credentials);
}

async function save(data, credentials) {
    const pack = await Package.from(data);
    return await pack.save(data, credentials);
}
