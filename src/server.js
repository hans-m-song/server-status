const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const spawn = require('child_process').spawn;

const app = express();
const port = process.env.PORT || 4242;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function exec(cmd, ...args) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args);
        const result = [];
        child.stdout.on('data', data => result.push(data.toString().replace(/\n$/, '')));
        child.on('close', code => resolve({ code, result }));
        child.on('error', err => reject(err));
    });
}

app.get('/alive', (req, res) => {
    res.status(200).send({ response: 'server is alive'});
});

app.get('/exec/uname', async (req, res) => {
    const response = { flags: [
        ['-s', 'kernel name'], 
        ['-n', 'node name'], 
        ['-r', 'kernel release'], 
        ['-v', 'kernel version'], 
        ['-m', 'machine'], 
        ['-o', 'operating system']
    ] };
    for (const [flag, name] of response.flags) {
        response[name] = (await exec('uname', flag)).result;
    }
    res.status(200).send(response);
});

app.get('/exec/df', async (req, res) => {
    const response = await exec('df', '-h');
    res.status(200).send(response);
});

app.get('/exec/uptime', async (req, res) => {
    const response = await exec('uptime');
    res.status(200).send(response);
});

app.get('/exec/top', async (req, res) => {
    const response = await exec('top', '-n', 1, '-b');
    res.status(200).send({ 
        ...response, 
        result: [ 
            ...response.result[0].replace(/top - /, 'System as of ').replace(/\sup/, ':').split(/\n/), 
            ...response.result[1].split(/\n/).slice(0, 3)
        ] 
    });
});

app.get('/exec/free', async (req, res) => {
    const response = await exec('free', '-h');
    res.status(200).send(response);
});

app.listen(port, () => console.log(`listening on port ${port}`));