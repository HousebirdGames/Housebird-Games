import { alertPopup, getRelativePath } from "../../Birdhouse/src/main.js";
import { updateTitleAndMeta } from "../../Birdhouse/src/main.js";

const sortOrders = {
    Name: 'desc',
    Counter: 'desc'
};

export default async function AnalyticsOverview() {
    updateTitleAndMeta('Analytics', 'Analytics Overview');
    const analytics = await getAnalytics();

    if (analytics) {
        const tableHtml = generateTable(analytics);
        setTimeout(setupEventHandlers, 0);
        return '<div class="contentBox"><table id="analytics-table-container">' +
            tableHtml +
            '</table><button id="refreshButton">Refresh</button>' +
            '<button id="downloadButton">Download Analytics</button>' +
            '<button id="resetButton">Reset Counters</button>' +
            '<button id="deleteButton">Delete Counters</button>' +
            '</div>';
    } else {
        return 'No analytics data available';
    }
}

function generateTable(data) {
    let table = `
                    <tr>
                        <th>Name</th>
                        <th>Counter</th>
                    </tr>`;

    data.forEach(row => {
        table += `<tr>
                    <td>${row.Name}</td>
                    <td>${row.Counter}</td>
                  </tr>`;
    });

    return table;
}

async function getAnalytics() {
    const response = await fetch(getRelativePath('./database/analytics.php') + '?retrieve');
    const data = await response.json();
    if (data.error) {
        console.error(data.error);
        return null;
    }
    return data;
}

function setupEventHandlers() {
    console.log('analytics-overview.js loaded');

    document.querySelector("table th:nth-child(1)").addEventListener('click', () => {
        sortTableByColumn('Name');
    });

    document.querySelector("table th:nth-child(2)").addEventListener('click', () => {
        sortTableByColumn('Counter');
    });

    document.getElementById('refreshButton').addEventListener('click', () => {
        location.reload();
    });

    document.getElementById('downloadButton').addEventListener('click', () => {
        getAnalytics().then(data => {
            downloadAnalytics(data);
        });
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        fetch(getRelativePath('./database/analytics.php') + '?reset', {
            method: 'POST',
        }).then(() => {
            reloadAnalytics();
        });
    });

    document.getElementById('deleteButton').addEventListener('click', () => {
        fetch(getRelativePath('./database/analytics.php') + '?delete', {
            method: 'POST',
        }).then(() => {
            reloadAnalytics();
        });
    });

    function reloadAnalytics() {
        getAnalytics().then(data => {
            const tableHtml = generateTable(data);
            document.getElementById('analytics-table-container').innerHTML = tableHtml;
            setupEventHandlers();
        });
    }
}

function sortTableByColumn(propertyName) {
    getAnalytics().then(data => {
        data.sort((a, b) => {
            if (propertyName === 'Counter') {
                if (Number(a[propertyName]) < Number(b[propertyName])) return sortOrders[propertyName] === 'asc' ? -1 : 1;
                if (Number(a[propertyName]) > Number(b[propertyName])) return sortOrders[propertyName] === 'asc' ? 1 : -1;
            } else {
                if (a[propertyName] < b[propertyName]) return sortOrders[propertyName] === 'asc' ? -1 : 1;
                if (a[propertyName] > b[propertyName]) return sortOrders[propertyName] === 'asc' ? 1 : -1;
            }
            return 0;
        });

        sortOrders[propertyName] = sortOrders[propertyName] === 'asc' ? 'desc' : 'asc';

        const tableHtml = generateTable(data);
        document.getElementById('analytics-table-container').innerHTML = tableHtml;

        setupEventHandlers();
    });
}

function downloadAnalytics(data) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const filename = `housebird_games_analytics_${year}-${month}-${day}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}