class Request {
    _err = null
    _params = {};

    constructor(data) {
        this._data = data.toString().replace(/(\r\n|\n|\r)/g, "\\n")

        const [_, head, body] = this._data.match(/^(.*)\\n\\n(.*)?$/);

        const lines = head.split('\\n');
        const [__, method, path, http] = lines.shift().match(/^(.*) (\/.*) (.*)$/);
        this._headers = {};
        lines.forEach(l => {
            const [_, header, value] = l.match(/^(.*): +(.*)$/);

            this._headers[header.toLowerCase()] = value;
        });

        this._head = head;
        this._body = body;
        this._method = method;
        this._path = path;
        this._http = http;

        let contentType = this.getHeader('Content-Type') || ''
        if (contentType === 'application/json') {
            try {
                this._body = JSON.parse(body.replace(/\\n/g, '\n'));
            } catch (e) {
                this._err = 'Invalid body (JSON expected)';
            }
        }
    }

    get data() {
        return this._data
    }

    get head() {
        return this._head
    }

    get body() {
        return this._body
    }

    get method() {
        return this._method
    }

    get path() {
        return this._path
    }

    get http() {
        return this._http
    }

    get headers() {
        return this._headers
    }

    get error() {
        return this._err
    }

    get params() {
        return this._params
    }

    set params(value) {
        this._params = value;
    }

    getHeader(key) {
        return this._headers[key.toLowerCase()];
    }

    static get METHOD() {
        return {
            GET: 'GET',
            POST: 'POST',
            HEAD: 'HEAD',
            PUT: 'PUT',
            DELETE: 'DELETE',
            CONNECT: 'CONNECT',
            OPTIONS: 'OPTIONS',
            TRACE: 'TRACE',
            PATCH: 'PATCH',
        }
    }
}

module.exports = {Request};