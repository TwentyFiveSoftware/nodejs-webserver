const net = require('net')

function generateUniqueId(length = 16) {
    // noinspection SpellCheckingInspection
    let result = '',
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        charactersLength = characters.length

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }

    return result
}

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

class Response {
    _code
    _content
    _headers

    constructor(code, content = '', headers = []) {
        this._code = code
        this._content = content
        this._headers = Array.isArray(headers) ? headers : []
    }

    static createErrorResponse(error, code) {
        const res = new Response(code || this.CODE.BAD_REQUEST, error.toString(), [
            'Content-Type: text/plain',
        ])

        return res.write()
    }

    write() {
        let contentType = this.getHeader('Content-Type')

        let headers = [...this._headers],
            length = this._content.toString().length,
            found = false

        if (!contentType) {
            headers['content-type'] = 'text/plain'
        }

        for (let key in headers) {
            if (!headers.hasOwnProperty(key)) continue
            let header = headers[key]

            if (header.match(/content-length/)) {
                headers[key] = header.split(':')[0] + ': ' + length
                found = true
                break
            }
        }

        if (!found) headers.push('Content-Length: ' + length)

        headers.unshift('HTTP/1.1 ' + this._code + ' ' + Response.RESPONSE_TEXT[this._code])

        return headers.join('\n') + '\n\n' + this._content.toString()
    }

    getHeader(key) {
        return this._headers[key.toLowerCase()];
    }

    static CODE = {
        CONTINUE: 100,
        SWITCHING_PROTOCOLS: 101,
        PROCESSING: 102,
        EARLY_HINTS: 103,
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NON_AUTHORITATIVE_INFORMATION: 203,
        NO_CONTENT: 204,
        RESET_CONTENT: 205,
        PARTIAL_CONTENT: 206,
        MULTI_STATUS: 207,
        ALREADY_REPORTED: 208,
        IM_USED: 226,
        MULTIPLE_CHOICES: 300,
        MOVED_PERMANENTLY: 301,
        FOUND: 302,
        SEE_OTHER: 303,
        NOT_MODIFIED: 304,
        USE_PROXY: 305,
        RESERVED: 306,
        TEMPORARY_REDIRECT: 307,
        PERMANENTLY_REDIRECT: 308,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        PAYMENT_REQUIRED: 402,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        NOT_ACCEPTABLE: 406,
        PROXY_AUTHENTICATION_REQUIRED: 407,
        REQUEST_TIMEOUT: 408,
        CONFLICT: 409,
        GONE: 410,
        LENGTH_REQUIRED: 411,
        PRECONDITION_FAILED: 412,
        REQUEST_ENTITY_TOO_LARGE: 413,
        REQUEST_URI_TOO_LONG: 414,
        UNSUPPORTED_MEDIA_TYPE: 415,
        REQUESTED_RANGE_NOT_SATISFIABLE: 416,
        EXPECTATION_FAILED: 417,
        I_AM_A_TEAPOT: 418,
        MISDIRECTED_REQUEST: 421,
        UNPROCESSABLE_ENTITY: 422,
        LOCKED: 423,
        FAILED_DEPENDENCY: 424,
        TOO_EARLY: 425,
        UPGRADE_REQUIRED: 426,
        PRECONDITION_REQUIRED: 428,
        TOO_MANY_REQUESTS: 429,
        REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
        UNAVAILABLE_FOR_LEGAL_REASONS: 451,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
        VERSION_NOT_SUPPORTED: 505,
        VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL: 506,
        INSUFFICIENT_STORAGE: 507,
        LOOP_DETECTED: 508,
        NOT_EXTENDED: 510,
        NETWORK_AUTHENTICATION_REQUIRED: 511,
    }

    static RESPONSE_TEXT = {
        100: 'Continue',
        101: 'Switching Protocols',
        102: 'Processing',
        103: 'Early Hints',
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        203: 'Non-Authoritative Information',
        204: 'No Content',
        205: 'Reset Content',
        206: 'Partial Content',
        207: 'Multi-Status',
        208: 'Already Reported',
        226: 'IM Used',
        300: 'Multiple Choices',
        301: 'Moved Permanently',
        302: 'Found',
        303: 'See Other',
        304: 'Not Modified',
        305: 'Use Proxy',
        307: 'Temporary Redirect',
        308: 'Permanent Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Payload Too Large',
        414: 'URI Too Long',
        415: 'Unsupported Media Type',
        416: 'Range Not Satisfiable',
        417: 'Expectation Failed',
        418: 'I\'m a teapot',
        421: 'Misdirected Request',
        422: 'Unprocessable Entity',
        423: 'Locked',
        424: 'Failed Dependency',
        425: 'Too Early',
        426: 'Upgrade Required',
        428: 'Precondition Required',
        429: 'Too Many Requests',
        431: 'Request Header Fields Too Large',
        451: 'Unavailable For Legal Reasons',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        505: 'HTTP Version Not Supported',
        506: 'Variant Also Negotiates',
        507: 'Insufficient Storage',
        508: 'Loop Detected',
        510: 'Not Extended',
        511: 'Network Authentication Required',
    }
}

class JsonResponse extends Response {
    constructor(code, content, headers) {
        if (!Array.isArray(headers)) headers = []

        headers['Content-Type'] = 'application/json'

        super(code, typeof content === 'string' ? content : JSON.stringify(content), headers)
    }
}

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

// ---------------------------------------------------------

let server = new Server(7777)

let users = [];

server.get('/', (request) => {
    const content = '<html><h1>HTML works!</h1></html>';

    const headers = [
        'Content-Type: text/html',
    ];

    return new Response(Response.CODE.OK, content, headers);
});

server.get('/users', (request) => {
    const content = JSON.stringify(users);

    const headers = [
        'Content-Type: application/json',
    ];

    return new Response(Response.CODE.OK, content, headers);
});

server.post('/users', (request) => {
    const user = {name: request.body.name, email: request.body.email, uuid: generateUniqueId()};

    users.push(user);

    return new JsonResponse(Response.CODE.OK, user);
});

server.delete('/users/{id}', (request) => {
    if (!users.find(u => u.uuid === request.params['id'])) {
        return new Response(Response.CODE.BAD_REQUEST);
    }

    users = users.filter(u => u.uuid !== request.params['id']);

    return new Response(Response.CODE.OK);
});
