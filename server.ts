import * as net from 'net';
import { Request } from './request';
import { Response } from './response';

interface ServerSettings {
    port: number;
    host: string;
}

class Endpoint {
    private readonly _method: string;
    private readonly _path: string;
    private readonly _callback: (req: Request, res: Response) => void;
    private readonly _pathRegex: RegExp;

    constructor(method: string, path: string, callback: (req: Request, res: Response) => void) {
        this._method = method;
        this._path = path;
        this._callback = callback;

        this._pathRegex = this.getPathRegex();
    }

    private getPathRegex(): RegExp {
        const params = this._path.match(/:\w+/g);

        let regex = `^${this.path}$`;
        if (!params) return RegExp(regex);

        for (const param of params) {
            regex = regex.replace(param, `(?<${param.match(/\w+/)}>(\\w*))`);
        }

        return RegExp(regex);
    }

    get method(): string {
        return this._method;
    }

    get path(): string {
        return this._path;
    }

    get callback(): (req: Request, res: Response) => void {
        return this._callback;
    }

    get pathRegex(): RegExp {
        return this._pathRegex;
    }
}

export class Server {
    private readonly _settings: ServerSettings;
    private readonly _endpoints: Endpoint[] = [];

    constructor(settings: ServerSettings) {
        this._settings = settings;

        this.startServer();
    }

    private startServer(): void {
        net.createServer((socket: net.Socket) => {
            socket.on('data', data => this.onRequest(socket, data));
        }).listen(this._settings.port, this._settings.host);
    }

    private onRequest(socket: net.Socket, data: Buffer): void {
        const request = new Request(data);
        const response = new Response(socket);

        const endpoint = this.getEndpoint(request);

        if (!endpoint) {
            response.status(404).end();
            return;
        }

        endpoint.callback(request, response);
    }

    private getEndpoint(request: Request): Endpoint {
        return this._endpoints.find(endpoint => {
            if (endpoint.method !== request.method) return false;

            const pathMatch = endpoint.pathRegex.exec(request.path);
            if (!pathMatch) return false;

            request.params = pathMatch.groups;
            return true;
        });
    }

    public get(path: string, callback: (req: Request, res: Response) => void): void {
        this._endpoints.push(new Endpoint('GET', path, callback));
    }

    public post(path: string, callback: (req: Request, res: Response) => void): void {
        this._endpoints.push(new Endpoint('POST', path, callback));
    }

    public delete(path: string, callback: (req: Request, res: Response) => void): void {
        this._endpoints.push(new Endpoint('DELETE', path, callback));
    }
}
