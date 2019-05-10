const root = document.querySelector('#root');

async function get(endpoint, json = true) {
    const response = await fetch(endpoint);
    const data = await response.text();
    return json ? await JSON.parse(data) : data;
}

(async () => {
    try {
        const response = await get('/exec/uname');
        const uname = document.createElement('div');
        uname.id = 'uname';
        for (const flag in response) {
            const p = document.createElement('p');
            p.classList.add('uname-field');
            p.id = flag;
            p.innerText = response[flag].result;
            uname.appendChild(p);
        }
        root.appendChild(uname);
    } catch (e) {
        console.log('failed to enumerate uname data', e);
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
        table.innerHTML = 
            `<thead>
                <tr>
                    ${data[0].map(field => `<th>
                        ${field}
                    </th>`).join('')}
                </tr>
            </thead>` + 
            `<tbody>
                ${data.slice(1).map(line => `<tr>
                    ${line.map(cell => `<td>
                        ${cell}
                    </td>`).join('')}
                </tr>`).join('')}
            </tbody>`;
        storage.appendChild(table);
        root.appendChild(storage);
    } catch (e) {
        console.log('failed to enumerate storage data', e);
    }
})();