import { alertPopup, getRelativePath, updateTitleAndMeta, getQueryParameterByName, updateOrAddQueryParameter, removeQueryParameter, action } from "../../Birdhouse/src/main.js";

const sortOrders = {
    Name: 'asc',
    Counter: 'asc',
    Date: 'asc'
};

export default async function AnalyticsOverview() {
    updateTitleAndMeta('Analytics', 'Analytics Overview');
    const analytics = await getAnalytics();
    let search = getQueryParameterByName('search') ? getQueryParameterByName('search') : '';

    if (analytics) {
        action(setupEventHandlers);

        const tableHtml = generateTable(analytics);

        const totalCount = analytics.reduce((acc, item) => acc + Number(item.Counter), 0);
        const uniqueDates = new Set(analytics.map(item => item.Date));
        const averagePerDay = (totalCount / uniqueDates.size).toFixed(2);

        const aggregatedDataHtml = `<div id="aggregated-data">
        <p>Total Count: ${totalCount}</p>
        <p>Average Per Day: ${averagePerDay}</p>
        </div>`;

        return '<div class="contentBox">' +
            '<div class="linkRow analytics">' +
            '<button id="clearFiltersButton">Clear</button>' +
            '<button id="refreshButton">Refresh</button>' +
            '<button id="downloadButton">Download Analytics</button></div>' +
            '<div class="linkRow analytics">' +
            '<button class="searchInputButton" data-input="Showing Projects">Homepage</button>' +
            '<button class="searchInputButton" data-input="Showing Blog">Blog</button>' +
            '<button class="searchInputButton" data-input="Showing post:">Posts</button>' +
            '<button class="searchInputButton" data-input="Click:">Link clicked</button>' +
            '<button class="searchInputButton" data-input="Maintenance">Maintenance</button>' +
            '</div>' +
            `<div id="filters">
            <label><input type="text" class="field" id="search-input" value="${search}" placeholder="Search by name"></label>
            <input type="date" class="field" id="start-date">
            <input type="date" class="field" id="end-date">
        </div>
        `+
            '<div class="linkRow analytics">' +
            '<button class="daysButton" data-days="0">Today</button>' +
            '<button class="daysButton" data-days="1">1 Day</button>' +
            '<button class="daysButton" data-days="3">3 Days</button>' +
            '<button class="daysButton" data-days="7">7 Days</button>' +
            '<button class="daysButton" data-days="30">30 Days</button>' +
            '<button class="daysButton" data-days="90">90 Days</button>' +
            '<button class="daysButton" data-days="365">1 Year</button>' +
            '</div>' +
            '<div id="analytics-chart-container"></div>' +
            aggregatedDataHtml +
            '<table id="analytics-table-container">' +
            tableHtml +
            '</table></div>';
    } else {
        return 'No analytics data available';
    }
}

function generateTable(data) {
    let table = `
        <tr>
            <th>Name</th>
            <th>Counter</th>
            <th>Date</th>
        </tr>`;

    data.forEach(row => {
        table += `<tr>
            <td>${row.Name}</td>
            <td>${row.Counter}</td>
            <td>${row.Date}</td>
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
    //console.log('analytics-overview.js loaded');

    document.querySelector("table th:nth-child(1)").addEventListener('click', () => {
        sortTableByColumn('Name');
    });

    document.querySelector("table th:nth-child(2)").addEventListener('click', () => {
        sortTableByColumn('Counter');
    });


    document.querySelector("table th:nth-child(3)").addEventListener('click', () => {
        sortTableByColumn('Date');
    });

    document.getElementById('refreshButton').addEventListener('click', () => {
        reloadAnalytics();
    });

    document.getElementById('downloadButton').addEventListener('click', () => {
        getAnalytics().then(data => {
            downloadAnalytics(data);
        });
    });

    const searchInput = document.getElementById('search-input');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');

    if (searchInput) {
        const searchInputButtons = document.querySelectorAll('.searchInputButton');
        searchInputButtons.forEach(searchInputButton => {
            searchInputButton.addEventListener('click', () => {
                searchInput.value = searchInputButton.getAttribute('data-input');
                reloadAnalytics();
            });
        });
    }

    if (startDate && endDate) {
        const currentDate = new Date();
        const startDateValue = '2023-01-01';
        startDate.value = startDateValue;
        endDate.value = currentDate.toISOString().split('T')[0];

        const daysButtons = document.querySelectorAll('.daysButton');
        daysButtons.forEach(daysButton => {
            daysButton.addEventListener('click', () => {
                const days = parseInt(daysButton.getAttribute('data-days'));
                const currentDate = new Date();
                const startDateValue = new Date(currentDate);

                startDateValue.setDate(currentDate.getDate() - days);
                startDate.value = startDateValue.toISOString().split('T')[0];
                endDate.value = currentDate.toISOString().split('T')[0];
                reloadAnalytics();
            });
        });
    }

    document.getElementById('clearFiltersButton').addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
        reloadAnalytics();
    });

    /* document.getElementById('resetButton').addEventListener('click', () => {
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
    }); */

    document.getElementById('search-input').addEventListener('input', reloadAnalytics);
    document.getElementById('start-date').addEventListener('change', reloadAnalytics);
    document.getElementById('end-date').addEventListener('change', reloadAnalytics);

    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.addEventListener('mouseover', () => {
            const tooltip = bar.querySelector('.tooltip');
            const date = bar.getAttribute('data-date');
            const count = bar.getAttribute('data-count');
            tooltip.innerHTML = `${date}: ${count}`;
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        });
        bar.addEventListener('mouseout', () => {
            const tooltip = bar.querySelector('.tooltip');
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });
    });

    reloadAnalytics();
}

function reloadAnalytics() {
    getAnalytics().then(data => {
        updateOrAddQueryParameter('search', document.getElementById('search-input').value);
        const searchInput = document.getElementById('search-input').value.toLowerCase();
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        const filteredData = data.filter(item => {
            const matchesSearch = item.Name.toLowerCase().includes(searchInput);
            const matchesStartDate = !startDate || new Date(item.Date) >= new Date(startDate);
            const matchesEndDate = !endDate || new Date(item.Date) <= new Date(endDate);
            return matchesSearch && matchesStartDate && matchesEndDate;
        });

        // Calculate total counts and average per day
        const totalCount = filteredData.reduce((acc, item) => acc + Number(item.Counter), 0);
        const uniqueDates = new Set(filteredData.map(item => item.Date));
        const averagePerDay = uniqueDates.size > 0 ? (totalCount / uniqueDates.size).toFixed(2) : 0;

        // Update HTML elements
        document.querySelector('#aggregated-data p:nth-child(1)').textContent = `Total Counts: ${totalCount}`;
        document.querySelector('#aggregated-data p:nth-child(2)').textContent = `Average Per Day: ${averagePerDay}`;

        const tableHtml = generateTable(filteredData);
        const barChartHtml = generateBarChart(filteredData);

        document.getElementById('analytics-table-container').innerHTML = tableHtml;
        document.getElementById('analytics-chart-container').innerHTML = barChartHtml;
    });
}

function sortTableByColumn(propertyName) {
    getAnalytics().then(data => {
        data.sort((a, b) => {
            if (['Counter'].includes(propertyName)) {
                return sortNumber(a[propertyName], b[propertyName], sortOrders[propertyName]);
            } else if (propertyName === 'Date') {
                return sortDate(a[propertyName], b[propertyName], sortOrders[propertyName]);
            } else {
                return sortString(a[propertyName], b[propertyName], sortOrders[propertyName]);
            }
        });

        sortOrders[propertyName] = sortOrders[propertyName] === 'asc' ? 'desc' : 'asc';

        const tableHtml = generateTable(data);
        document.getElementById('analytics-table-container').innerHTML = tableHtml;

        setupEventHandlers();
    });
}

function sortNumber(a, b, order) {
    if (Number(a) < Number(b)) return order === 'asc' ? -1 : 1;
    if (Number(a) > Number(b)) return order === 'asc' ? 1 : -1;
    return 0;
}

function sortDate(a, b, order) {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (dateA < dateB) return order === 'asc' ? -1 : 1;
    if (dateA > dateB) return order === 'asc' ? 1 : -1;
    return 0;
}

function sortString(a, b, order) {
    if (a < b) return order === 'asc' ? -1 : 1;
    if (a > b) return order === 'asc' ? 1 : -1;
    return 0;
}

function downloadAnalytics(data) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const filename = `the_friend_ship_analytics_${year}-${month}-${day}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function generateBarChart(data) {
    let chartHtml = '<div id="bar-chart">';

    // Group data by date and sum the counters
    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.Date]) {
            acc[item.Date] = 0;
        }
        acc[item.Date] += Number(item.Counter);
        return acc;
    }, {});

    // Get the start and end dates from the inputs
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);

    // Generate a date range between the start and end dates
    const dateRange = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        dateRange.push(dateString);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in the missing dates with a count of 0
    const filledData = dateRange.reduce((acc, date) => {
        acc[date] = groupedData[date] || 0;
        return acc;
    }, {});

    // Convert the filled data to an array and sort it by date
    const sortedData = Object.entries(filledData)
        .map(([Date, Counter]) => ({ Date, Counter }))
        .sort((a, b) => new Date(a.Date) - new Date(b.Date));


    const maxCount = Math.max(...sortedData.map(item => item.Counter));

    sortedData.forEach(item => {
        chartHtml += `<div class="bar" data-date="${item.Date}" data-count="${item.Counter}">
                          <div class="tooltip">${item.Date}: ${item.Counter}</div>
                      </div>`;
    });

    setTimeout(() => {
        sortedData.forEach(item => {
            const bar = document.querySelector(`.bar[data-date="${item.Date}"]`);
            const height = (item.Counter / maxCount) * 100;
            bar.style.height = height + '%';
        });
    }, 0);

    chartHtml += '</div>';
    return chartHtml;
}