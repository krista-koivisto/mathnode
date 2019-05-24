const crypto = require('crypto');

const timesteps = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
}

// Filter function for objects
Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key, obj[key]))
        .reduce((result, key) => (result[key] = obj[key], result), {});

// Convert a Date object to a MySQL datetime string
const dateToMySQL = date => date.toISOString().slice(0, 19).replace('T', ' ');

// Simple assert function
if (!assert) var assert = (stmt, code = 500, err = "Something internal made a sad! :(") => { if (stmt) { return true } else { throw {err: err, code: code, msg: err}; }};

// Makes Base64 URL safe
const safeB64 = b64 => b64.split('=')[0].replace(/\+/g, '-').replace(/\//g, '_');

module.exports = {
    timesteps: timesteps,
    assert: assert,
    safeB64: safeB64,
    dateToMySQL: dateToMySQL,
    generateToken: generateToken,
};

// Asynchronously generate a URL-safe Base64 token
function generateToken() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(48, (err, token) => {
            if (err) {
                reject(err);
            } else {
                resolve(safeB64(token.toString('base64')));
            }
        });
    }).catch(err => console.log(err));
}
