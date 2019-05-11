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

(async () => {
    const statistics = document.createElement('div');
    statistics.id = 'statistics';
    root.appendChild(statistics);
    setInterval(async () => {
        try {
            const response = (await get('/exec/top')).result;
            statistics.innerHTML = '';
            const data = response.map(el => el.split(/[,\.:]\s+/));
            for (const [field, ...content] of data) {
                statistics.innerHTML += 
                    `<p><span class='label'>${field}: </span>${content.join(', ')}</p>`;
            }
        } catch (e) {
            console.log('failed to enumerate statistics', e);
        }
    }, 5000);
})();
