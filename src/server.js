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
    const flags = [ '-s', '-n', '-r', '-v', '-m', '-o' ];
    const response = {};
    for (const flag of flags) {
        response[flag] = await exec('uname', flag);
    }
    res.status(200).send(response);
});

app.get('/exec/df', async (req, res) => {
    const response = await exec('df', '-h');
    res.status(200).send(response);
})

app.listen(port, () => console.log(`listening on port ${port}`));