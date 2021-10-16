const {Response, JsonResponse} = require('./response')
const {Server} = require('./server')
const {generateUniqueId} = require('./utility')

let users = [];

const server = new Server(7777)

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
