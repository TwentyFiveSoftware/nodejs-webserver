export class Request {
    private readonly _plain: string;
    private readonly _method: string;
    private readonly _path: string;
    private readonly _headers: { [header: string]: string };
    private readonly _body: string;
    private _params: { [param: string]: string } = {};

    constructor(data: Buffer) {
        this._plain = data.toString().replace(/(\r\n|\n|\r)/g, '\\n');

        const [_, head, body] = this._plain.match(/^(.*)\\n\\n(.*)?$/);

        const lines = head.split('\\n');
        const [__, method, path] = lines.shift().match(/^(.*) (\/.*) (.*)$/);

        this._headers = lines.reduce((headers, line) => {
            const [_, header, value] = line.match(/^(.*): +(.*)$/);
            headers[header.toLowerCase()] = value;
            return headers;
        }, {});

        this._method = method;
        this._path = path;
        this._body = body?.replace(/\\n/g, '\n') ?? '';
    }

    get method(): string {
        return this._method;
    }

    get path(): string {
        return this._path;
    }

    get headers(): { [header: string]: string } {
        return this._headers;
    }

    get body(): string {
        return this._body;
    }

    get params(): { [p: string]: string } {
        return this._params;
    }

    set params(value: { [p: string]: string }) {
        this._params = value;
    }

    public getHeader(header: string): string {
        return this._headers[header.toLowerCase()];
    }

    public isJson(): boolean {
        if (this.getHeader('Content-Type') !== 'application/json') return false;

        try {
            JSON.parse(this._body);
        } catch (_) {
            return false;
        }

        return true;
    }

    public json(): any {
        return JSON.parse(this._body);
    }
}
