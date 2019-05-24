var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    auth = require('./auth.js'),
    express = require('express'),
    mathnode = require('./mathnode/mathnode'),
    bodyParser = require('body-parser');

const config = {
    host:     "192.168.0.1", // Change to your own host
    user:     "mathnode", // Change to own db user
    password: "password", // Change to own password
    database: 'mathnode', // Change to own db
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const app     = express();
const mn      = new mathnode.Server(config);
const layouts = mn.layouts;
const packs   = mn.packages;
const users   = mn.users;
const debug   = true;

var errorHandler = (res, err) => {
    if (!err.msg) {
        err.code = 500;
        err.msg = "Some kinda internal oopsie happened with the poor server! :(";
    }

    if (debug === true) {
        console.log(err);
        if (err.log) console.log(err.log);
    }

    res.writeHead(err.code);
    res.end(err.msg);
}

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

// Generic action
const performAction = async (req, res, respCode, action, onError = (res, err) => { errorHandler(res, err); }) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await action(credentials, req);
            res.writeHead(respCode);
            res.end();
        }
    } catch (err) {
        onError(res, err);
    }
}

// Packages

app.post('/package', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await packs.save(req.body, credentials);
            res.writeHead(201);
            res.end();
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

app.put('/package', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await packs.save(req.body, credentials);
            res.writeHead(204);
            res.end();
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

app.put('/package/:url/publish/:publish', async (req, res) => {
    await performAction(req, res, 204, async (credentials, req) => {
        await packs.update({url: req.params.url, status: req.params.publish}, credentials);
    }, (res, err) => {
        if (err.code == 403) {
            errorHandler(res, err);
        } else {
            errorHandler(res, {code: 400, msg: "Invalid query.", log: err});
        }
    });
});

app.get('/package/:url', async (req, res) => {
    try {
        let package = {};
        const credentials = auth.get(req.headers.authorization);

        if (await users.authenticate(credentials, false)) {
            package = await packs.get({ url: req.params.url }, credentials );
        } else {
            package = await packs.get({ url: req.params.url }, {id: -1});
        }

        res.writeHead(200);
        res.end(JSON.stringify(package));
    } catch (err) {
        errorHandler(res, err);
    }
});

app.get('/search/packages/:name', async (req, res) => {
    try {
        let packages = {};
        const credentials = auth.get(req.headers.authorization);

        if (await users.authenticate(credentials, false)) {
            packages = await packs.search({ name: req.params.name }, credentials);
        } else {
            packages = await packs.search({ name: req.params.name }, {id: -1});
        }

        res.writeHead(200);
        res.end(JSON.stringify(packages));
    } catch (err) {
        errorHandler(res, err);
    }
});

app.delete('/package/:package', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await packs.remove({url: req.params.package}, credentials);
            res.writeHead(204);
            res.end();
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

// Users

app.post('/user', async (req, res) => {
    try {
        if (await users.create(req.body)) {
            res.writeHead(201);
            res.end('Why, hello there, new person!');
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

app.post('/user/signin', async (req, res) => {
    try {
        const user = await users.signin(req.body);
        res.writeHead(200);
        res.end(JSON.stringify(user));
    } catch (err) {
        errorHandler(res, err, 401, "That does not look right...");
    }
});

app.put('/user/:user', async (req, res) => {
    try {
        const authority = auth.get(req.headers.authorization);
        await users.update(req.params.user, authority, req.body);
        res.writeHead(204);
        res.end();
    } catch (err) {
        errorHandler(res, err);
    }
});

app.get('/session/verify', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        await users.authenticate(credentials);
        res.writeHead(200);
        res.end();
    } catch (err) {
        errorHandler(res, {code: 403, msg: "Your session token has expired. Please log in again!"});
    }
});

app.get('/user/signout', async (req, res) => {
    try {
        const authority = auth.get(req.headers.authorization);
        const user = await users.signout(authority);
        res.writeHead(204);
        res.end();
    } catch (err) {
        errorHandler(res, err, 401, "That does not look right...");
    }
});

app.get('/user/:user', async (req, res) => {
    try {
        const user = await users.get(req.params.user);
        res.writeHead(200);
        res.end(JSON.stringify(user));
    } catch (err) {
        errorHandler(res, err, 401, "That does not look right...");
    }
});

app.get('/user/:user/:what', async (req, res) => {
    try {
        const authority = auth.get(req.headers.authorization);
        const data = await users.retrieve(req.params.user, [req.params.what], authority);
        res.writeHead(200);
        res.end(JSON.stringify(data[0]));
    } catch (err) {
        errorHandler(res, err, 401, "That does not look right...");
    }
});

app.delete('/user/:user', async (req, res) => {
    try {
        const authority = auth.get(req.headers.authorization);
        await users.remove(req.params.user, authority);
        res.writeHead(204);
        res.end();
    } catch (err) {
        errorHandler(res, err);
    }
});

// Layouts

app.get('/layout/:layout', async (req, res) => {
    try {
        const layout = await layouts.get(req.params.layout);
        res.writeHead(200);
        res.end(JSON.stringify(layout));
    } catch (err) {
        errorHandler(res, err, 401, "That does not look right...");
    }
});

app.put('/layout', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await layouts.save(req.body, credentials);
            res.writeHead(204);
            res.end();
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

app.put('/layout/:layout/category/:category/package/:package/position/:position', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await layouts.add({what: 'package', id: req.params.layout, package: req.params.package, category: req.params.category, position: req.params.position}, credentials);
            res.writeHead(204);
            res.end();
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

app.delete('/layout/:layout', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await layouts.remove({what: 'layout', id: req.params.layout}, credentials);
            res.writeHead(204);
            res.end();
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

app.delete('/layout/:layout/package/:package', async (req, res) => {
    try {
        const credentials = auth.get(req.headers.authorization);
        if (await users.authenticate(credentials)) {
            await layouts.remove({what: 'package', id: req.params.layout, package: req.params.package}, credentials);
            res.writeHead(204);
            res.end();
        }
    } catch (err) {
        errorHandler(res, err);
    }
});

var options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/cert.pem'),
};

var server = https.createServer(options, app).listen(8081, function () {
   var host = server.address().address;
   var port = server.address().port;
});
