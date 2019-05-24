function get(credentials) {
    const data = credentials.trim().split(/ (.+)/);
    const scheme = data[0];
    var params = {};

    // Convert parameters into objects.
    data[1].trim().split(',').map(param => {
        const parts = param.split(/=(.+)/);
        params[parts[0].trim()] = parts[1].trim().replace(/\"(.*?)\"/, "$1");
    });

    switch(scheme) {
        case 'MN-AUTH':
            return JSON.parse(Buffer.from(params.auth, 'base64').toString());
        default:
            throw {code: 400, msg: "Unknown authorization protocol '" + data[0] + "'!"};
    }
}

module.exports = {
    get: get,
};
