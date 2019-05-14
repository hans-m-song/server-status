const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const spawn = require('child_process').spawn;

const app = express();
const port = process.env.PORT || 4242;
let allowRestart = true;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function exec(cmd) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, { shell: true });
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
        response[name] = (await exec('uname ' + flag)).result;
    }
    res.status(200).send(response);
});

app.get('/exec/df', async (req, res) => {
    const response = await exec('df -h');
    res.status(200).send(response);
});

app.get('/exec/uptime', async (req, res) => {
    const response = await exec('uptime');
    res.status(200).send(response);
});

app.get('/exec/top', async (req, res) => {
    const response = await exec('top -n 1 -b | head -n5');
    res.status(200).send({ 
        ...response, 
        result: [ 
            ...response.result[0]
                .replace(/top - /, 'System as of ')
                .replace(/\sup/, ':')
                .split(/\n/)
        ] 
    });
});

app.get('/exec/free', async (req, res) => {
    const response = await exec('free -m');
    res.status(200).send(response);
});

const listProcesses = 
`ps -ef | grep -P \\(grep\\){0}.*?python.*?\\(launcher\\|red\\)\\.py | awk '{print $2}'`; // discord bot
// `ps -ef | grep -P \\(grep\\){0}.*?node.*?server\.js$ | awk '{print $2}'`; // node server

app.get('/discordbot/status', async (req, res) => {
    const response = await exec(listProcesses);
    res.status(200).send(response);
});

app.get('/discordbot/restart', async (req, res) => {
    if (!allowRestart) {
        res.status(403).send({ message: 'wait for 30 seconds before trying again' });
    } else {
        allowRestart = false;
        setTimeout(() => {
            allowRestart = true;
        }, 30000);
        const response = await exec(listProcesses);
        if (response.result.length > 0) {
            for (const pid in response.result) {
                await exec('kill ' + pid);
            }
        } else {
            await exec('discordbot');
        }
        res.status(200).send();
    }
});

app.listen(port, () => console.log(`listening on port ${port}`));