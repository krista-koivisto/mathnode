const user = require('./classes/user');
const User = user.User;
const setPool = user.setPool;

module.exports = {
    get:    get,
    search: search,
    create: create,
    update: update,
    remove: remove,
    signin: signin,
    signout: signout,
    setPool: setPool,
    retrieve: retrieve,
    authenticate: authenticate,
};

async function create(data) {
    const user = await User.from(data);
    return await user.register();
}

async function get(id) {
    const user = await User.find({id: id});
    return user.clean();
}

async function retrieve(who, what, authority) {
    const user = await User.from({id: who});
    return await user.retrieve(what, authority);
}

async function search(data) {
}

async function authenticate(credentials, mustAuthenticate = true) {
    if (credentials.id) {
        const authority = await User.find({id: credentials.id});
        return await authority.authenticate(credentials.token);
    } else if (mustAuthenticate) {
        throw {code: 401, msg: "You need to be logged in to perform that action!"};
        return false;
    } else {
        return false;
    }
}

async function signin(credentials) {
    const user = await User.find({email: credentials.email});
    return await user.signin(credentials);
}

async function signout(credentials) {
    const user = await User.find({id: credentials.id});
    return await user.signout(credentials);
}

async function remove(id, credentials) {
    const authority = await User.find({id: credentials.id});
    await authority.authenticate(credentials.token);

    const user = await User.find({id: id});
    return await user.remove(authority);
}

async function update(id, credentials, data) {
    const authority = await User.find({id: credentials.id});
    await authority.authenticate(credentials.token);

    const user = await User.find({id: id});
    return await user.update(authority, data);
}
