import { Server } from './server';
import { nanoid } from 'nanoid';

interface User {
    name: string;
    email: string;
    uuid: string;
}

let users: User[] = [];

const server = new Server({ port: 7777, host: '127.0.0.1' });

server.get('/', (req, res) => {
    res.status(200).html('<html><h1>hello world!</h1></html>');
});

server.get('/users', (req, res) => {
    res.status(200).json(users);
});

server.post('/users', (req, res) => {
    if (!req.isJson()) {
        res.status(400).end();
        return;
    }

    const { name, email } = req.json();

    if (!name || !email) {
        res.status(400).end();
        return;
    }

    const user: User = { name, email, uuid: nanoid() };
    users.push(user);

    res.status(200).json(user);
});

server.delete('/users/:uuid', (req, res) => {
    if (!req.params['uuid']) {
        res.status(400).end();
        return;
    }

    users = users.filter(user => user.uuid !== req.params['uuid']);
    res.status(200).end();
});
