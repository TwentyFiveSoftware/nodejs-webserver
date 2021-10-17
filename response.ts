import * as net from 'net';

export class Response {
    private readonly _socket: net.Socket;
    private _status: number = 200;
    private _content: string = '';
    private _headers: { [header: string]: string } = {};

    constructor(socket: net.Socket) {
        this._socket = socket;
    }

    public status(status: number): Response {
        this._status = status;
        return this;
    }

    public html(content: string): void {
        this._content = content;
        this._headers['Content-Type'] = 'text/html';
        this.end();
    }

    public json(content: any): void {
        this._content = JSON.stringify(content);
        this._headers['Content-Type'] = 'application/json';
        this.end();
    }

    public end(): void {
        this._headers['Content-Length'] = this._content.length.toString();
        const headers = Object.entries(this._headers).map(header => `${header[0]}: ${header[1]}`);

        this._socket.write(`HTTP/1.1 ${this._status}\n${headers.join('\n')}\n\n${this._content}`);
        this._socket.end();
    }
}
