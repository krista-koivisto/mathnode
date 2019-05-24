const   mysql = require('mysql2/promise');

class Server {
    constructor(config) {
        this.users = require('./users');
        this.packages = require('./packages');
        this.layouts =  require('./layouts');

        this.pool = mysql.createPool(config);
        this.users.setPool(this.pool);
        this.packages.setPool(this.pool);
        this.layouts.setPool(this.pool);

        console.log("MathNode server listening...");
    }
}

module.exports = {
    Server: Server,
};
