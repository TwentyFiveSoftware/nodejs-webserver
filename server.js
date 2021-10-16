const net = require('net');
const {Request} = require('./request')
const {Response} = require('./response')

class Endpoint {
    _method;
    _path;
    _callback;

    constructor(method, path, callback) {
        this._method = method;
        this._path = path;
        this._callback = callback;
    }

    get method() {
        return this._method
    }

    get path() {
        return this._path
    }

    get callback() {
        return this._callback
    }
}

class Server {
    _endpoints

    constructor(port) {
        this._endpoints = []

        const server = net.createServer((c) => {
            c.on('data', (data) => {
                this._request(c, data);
            });
        });

        server.listen(port, '127.0.0.1', () => 'Listening...');
    }

    get(path, callback) {
        this._endpoints.push(new Endpoint(Request.METHOD.GET, path, callback));
    };

    post(path, callback) {
        this._endpoints.push(new Endpoint(Request.METHOD.POST, path, callback));
    };

    delete(path, callback) {
        this._endpoints.push(new Endpoint(Request.METHOD.DELETE, path, callback));
    };

    _request(c, data) {
        let request = new Request(data)

        if (request.error) {
            c.write(Response.createErrorResponse(request.error))
            c.end()

            return
        }

        let endpoint = this._endpoints.find(endpoint => endpoint.method === request.method && endpoint.path === request.path);

        if (!endpoint) {
            endpoint = this._endpoints.find(endpoint => {
                if (!endpoint.path.match(/[{}]/)) return false

                let matches = endpoint.path.match(/({[a-zA-Z]+})/g)

                if (!matches) return false

                let regex = '^' + endpoint.path + '$'

                for (let match of matches) {
                    let name = match.replace(/[{}]/g, '')

                    regex = regex.replace(match, match.replace(match, '(?<' + name + '>([a-zA-Z0-9]+))'))
                }

                regex = RegExp(regex)

                let res = request.path.match(regex)

                if (res && res.groups) {
                    request.params = res.groups

                    return true
                }

                return false
            })
        }

        let response;

        if (!endpoint) {
            response = new Response(Response.CODE.NOT_FOUND, '404 Not found');
        } else {
            response = endpoint.callback(request);
        }

        if (!(response instanceof Response)) {
            return;
        }

        c.write(response.write())
        c.end()
    }
}

module.exports = {
    Server,
}