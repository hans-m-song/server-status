const root = document.querySelector('#root');

async function get(endpoint, json = true) {
    const response = await fetch(endpoint);
    const data = await response.text();
    return json ? await JSON.parse(data) : data;
}

(async () => {
    try {
        const response = await get('/exec/uname');
        const status = document.createElement('div');
        status.id = 'status';
        for (const [flag, name] of response.flags) {
            status.innerHTML += 
            `<p class='uname-field'>
                <span class='label'>${name}: </span>
                ${response[name]}
            </p>`;
        }
        root.appendChild(status);
    } catch (e) {
        console.log('failed to enumerate uname data', e);
    }

    try {
        const response = (await get('/exec/uptime')).result[0];
        const status = document.getElementById('status');
        const uptime = response
            .replace(/^.*up\s+|,\s+\d+\suser.*$/g, '')
            .replace(/:/, ' hours, ') 
            + ' minutes';
        status.innerHTML += 
        `<p class='uptime-field'>
            <span class='label'>uptime: </span>
            ${uptime}
        </p>`;
    } catch (e) {
        console.log('failed to enumerate uptime data', e);
    }
})();

(async () => {
    try {
        const response = (await get('/exec/df')).result[0];
        const data = response.split(/\n/).map(line => line.split(/\s+/));
        const storage = document.createElement('div');
        storage.id = 'storage';
        const table = document.createElement('table');
        table.id = 'storage-table';
        table.innerHTML = `<thead><tr></tr></thead><tbody></tbody>`;
        data[0].slice(0, data[0].length - 1).forEach(field => {
            table.tHead.rows[0].innerHTML += `<th>${field}</th>`;
        });
        data.slice(1).forEach(line => {
            table.tBodies[0].innerHTML += 
                line.map(cell => `<td>${cell}</td>`).join('');
        });
        storage.appendChild(table);
        root.appendChild(storage);
    } catch (e) {
        console.log('failed to enumerate storage data', e);
    }
})();

function initGraphs () {
    const memoryGraphCtx = document.getElementById('memory-graph').getContext('2d');
    const memoryGraph = new Chart(memoryGraphCtx, {
        type: 'line',
        data: {
            labels: [ 45, 40, 35, 30, 25, 20, 15, 10, 5, 0 ],
            datasets: [{
                label: 'memory usage (MB)',
                data: new Array(10).fill(0)
            }]
        },
        options: {
            elements: {
                line: {
                    tension: 0
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

    const swapGraphCtx = document.getElementById('swap-graph').getContext('2d');
    const swapGraph = new Chart(swapGraphCtx, {
        type: 'line',
        data: {
            labels: [ 45, 40, 35, 30, 25, 20, 15, 10, 5, 0 ],
            datasets: [{
                label: 'swap usage (MB)',
                data: new Array(10).fill(0)
            }]
        },
        options: {
            elements: {
                line: {
                    tension: 0
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    
    return { memoryGraph, swapGraph };
}

function updateGraph(graph, value) {
    graph.data.datasets[0].data = [ 
        ...graph.data.datasets[0].data.slice(1), 
        value 
    ];
    graph.update();
}

(async () => {
    const statistics = document.createElement('div');
    statistics.id = 'statistics';
    statistics.innerHTML = 
        `<div id='text'></div>
        <div id='graphs'>
            <canvas id='memory-graph'></canvas>
            <canvas id='swap-graph'></canvas>
        </div>`;
    root.appendChild(statistics);
    
    const { memoryGraph, swapGraph } = initGraphs();

    const intervalHandler = async () => {
        const toMB = (str) => Math.floor(parseInt(str.replace(/[^\d]/g, '')) / 976.562);
        try {
            const freeResponse = (await get('/exec/free')).result[0];
            const freeData = freeResponse.split('\n').map(line => line.split(/\s+/).filter(el => el !== ''));
            statistics.children.text.innerHTML = `<table id='free-table'><thead><tr><th></th></tr></thead><tbody></tbody></table>`;
            const table = document.getElementById('free-table');
            freeData[0].forEach(header => table.tHead.rows[0].innerHTML += `<th>${header}</th>`);
            freeData.slice(1).forEach(line => {
                table.tBodies[0].innerHTML += 
                    line.map(cell => `<td>${cell}</td>`).join('');
            });

            const topResponse = (await get('/exec/top')).result;
            const topData = topResponse.map(el => el.split(/[,\.:]\s+/));
            if (typeof memoryGraph.options.scales.yAxes[0].ticks.suggestedMax === 'undefined') {
                memoryGraph.options.scales.yAxes[0].ticks.max = toMB(topData[3][1]);
                swapGraph.options.scales.yAxes[0].ticks.max = toMB(topData[4][1]);
            }

            updateGraph(memoryGraph, toMB(topData[3][3]));
            updateGraph(swapGraph, toMB(topData[4][3]));
        } catch (e) {
            console.log('failed to enumerate statistics', e);
        }
    }
    await intervalHandler();
    setInterval(intervalHandler, 5000);
})();

const restartBot = async () => await fetch('/discordbot/restart');

(async () => {
    const discordbot = document.createElement('div');
    discordbot.id = 'discordbot';
    root.appendChild(discordbot);
    const intervalHandler = async () => {
        try {
            const response = (await get('/discordbot/status')).result;
            discordbot.innerHTML = 
                `<p>bot status: ${((response.length > 0) ? `active` : `offline`)}</p>` + 
                `<button onclick="restartBot()">restart</button>`;
        } catch (e) {
            console.log('failed to enumerate discord bot status');
        }
    }
    await intervalHandler();
    setInterval(intervalHandler, 5000);
})();
