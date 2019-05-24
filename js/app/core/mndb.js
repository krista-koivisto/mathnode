/*
 * Mathnode / Core / MNDB
 *
 * Interface between the MathNode server and this client. Handles all requests
 * to the server asynchronously using the MathNode API.
 *
 */

var mndb = {
    xhr: async (method, url, data) => {
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            const mnauth = btoa(JSON.stringify({id: mndb.credentials.id, token: mndb.credentials.token}));
            const resource = url + ((data.resource && data.resource.toString().length) ? ('/' + data.resource.toString()) : '');

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({code: xhr.status, body: xhr.responseText});
                    } else {
                        reject({code: xhr.status, body: xhr.responseText});
                    }
                };
            };

            xhr.open(method, resource, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader('Authorization','MN-AUTH auth="' + mnauth + '"');
            xhr.send(data.body);
        }).catch(err => console.log(err));
    }
}

mndb.server = {
    //port: 8081,
    port: 49781,
    host: 'https://snarkypixel.com',
};

mndb.credentials = {
    id: null,
    token: null
}

mndb.http = {
    get: async (action, data = {resource: '', body: ''}) => {
        return await mndb.xhr('GET', mndb.server.host+':'+mndb.server.port+'/'+action.replace(/\s+/g, '/'), data);
    },
    post: async (action, data = {resource: '', body: ''}) => {
        return await mndb.xhr('POST',  mndb.server.host+':'+mndb.server.port+'/'+action.replace(/\s+/g, '/'), data);
    },
    put: async (action, data = {resource: '', body: ''}) => {
        return await mndb.xhr('PUT',  mndb.server.host+':'+mndb.server.port+'/'+action.replace(/\s+/g, '/'), data);
    },
    delete: async (action, data = {resource: '', body: ''}) => {
        return await mndb.xhr('DELETE',  mndb.server.host+':'+mndb.server.port+'/'+action.replace(/\s+/g, '/'), data);
    },
};

mndb.package = {
    search: async (name) => {
        const response = await mndb.http.get('search packages', { resource: name });
        return JSON.parse(response.body);
    },
    get: async (url) => {
        const response = await mndb.http.get('package', { resource: url });
        const data = JSON.parse(response.body);
        data.graph = JSON.parse(data.graph);

        return data;
    },
    save: async (name, graph) => {
        const simple = graph.simplify(EvaluationComponent);
        const url = urlify(name);
        const params = {
            user: mndb.credentials,
            name: name,
            url: url,
            status: 1, // Published
            expression: simple.expression,
            graph: JSON.stringify(simple.nodes)
        };

        // @TODO: Move (add?) to server
        if (url.length < 3) throw "Name has to be at least 3 letters long!";

        return await mndb.http.put('package', { body: JSON.stringify(params) });
    },
    update: async (url, what, value) => {
        return await mndb.http.put('package', { resource: url + '/' + what + '/' + value });
    },
    remove: async (url) => {
        return await mndb.http.delete('package', { resource: url }, { body: JSON.stringify({url: url}) });
    },
};

mndb.user = {
    create: async (name, email, password) => {
        return await mndb.http.post('user', { body: JSON.stringify({ name: name, email: email, password: password }) });
    },
    signin: async (email, password) => {
        const user = await mndb.http.post('user signin', { body: JSON.stringify({ email: email, password: password }) });
        return mndb.credentials = user ? JSON.parse(user.body) : mndb.credentials;
    },
    signout: async () => {
        const result = await mndb.http.get('user signout');
        mndb.credentials = { id: null, token: null };
        return result;
    },
    update: async(user) => {
        return await mndb.http.put('user', { resource: user.id, body: JSON.stringify(user) });
    },
    remove: async(user) => {
        return await mndb.http.delete('user', { resource: user.id });
    },
    get: async(user) => {
        const result = await mndb.http.get('user', { resource: user.id });
        return JSON.parse(result.body);
    },
    retrieve: async(data) => {
        const result = await mndb.http.get('user ' + data.user.id + ' ' + data.thing);
        return JSON.parse(result.body);
    }
};

mndb.layout = {
    get: async(data) => {
        const result = await mndb.http.get('layout', { resource: data.id });
        return JSON.parse(result.body);
    },
    save: async (data) => {
        return await mndb.http.put('layout', { body: JSON.stringify(data) });
    },
    remove: async (id) => {
        return await mndb.http.delete('layout', { resource: id });
    },
    removePackage: async(layout, id) => {
        return await mndb.http.delete('layout', { resource: layout + '/package/' + id });
    },
    addPackage: async(layout, category, position, id) => {
        return await mndb.http.put('layout', { resource: layout + '/category/' + category + '/package/' + id + '/position/' + position });
    },
};

mndb.session = {
    verify: async() => {
        return await mndb.http.get('session verify');
    },
    clear: async() => {
        mndb.credentials = {id: null, token: null}
    }
};
