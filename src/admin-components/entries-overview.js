import { alertPopup, alertPopupClose, updateTitleAndMeta, getRelativePath } from "../../Birdhouse/src/main.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function EntriesOverview(standalone = true) {
    if (standalone) {
        Analytics('Showing Entries Overview');
        updateTitleAndMeta('Entries Overview', 'Overview of all entries');
    }

    let entryDataCollection = [];
    return new Promise((resolve, reject) => {
        fetch('./database/get_entries.php?full')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch entries');
                }

                return response.json();
            })
            .then(response => {
                entryDataCollection = response.items;

                const entriesHTML = response.items.map((entry, index) => `
                    <div class="entryOverviewItem outer" data-index="${index}"'>
                        <div class=""><a href="${getRelativePath(entry.slug)}" class="white">${entry.title}</a></div>
                        <div class="expandingSpacer"></div>
                        <div class="entryOverviewItem">
                        <div class="entryInfo position">Pos: ${entry.position}</div>
                        <div class="entryInfo">ID: ${entry.id}</div>
                        <div class="entryInfo">${entry.date}</div>
                        <div class="entryInfo">${entry.state}</div>
                        <a class="" href="${getRelativePath('entries') + '?id=' + entry.id}">Edit</a>
                        </div>
                    </div>
                `).join('');

                resolve(`
                    <div class="entriesOverview">
                        <h2>Entries Overview</h2>
                        
                        <label><input type="text" id="searchTitleInput" placeholder="Search by title"/></label>
                        <label><input type="text" id="searchContentInput" placeholder="Search by notice, description and content"/></label>
                        
                        <div class="filters">
                            <label><input type="checkbox" class="filter" id="statePublic"> Public</label>
                            <label><input type="checkbox" class="filter" id="stateHidden"> Hidden</label>
                            <label><input type="checkbox" class="filter" id="stateInternal"> Internal</label>
                            <label><input type="checkbox" class="filter" id="homepage"> Homepage</label>
                            <label><input type="checkbox" class="filter" id="noDescription"> No Description</label>
                            <label><input type="checkbox" class="filter" id="noContent"> No Content</label>
                            <label><input type="checkbox" class="filter" id="noMainLink"> No Main Link</label>
                            <label><input type="checkbox" class="filter" id="noSlug"> No Slug</label>
                        </div>
                        
                        <select id="sortOptions">
                            <option value="date-desc">Date Descending</option>
                            <option value="date-asc">Date Ascending</option>
                            <option value="title-asc">Title Ascending</option>
                            <option value="title-desc">Title Descending</option>
                            <option value="position-asc">Position Ascending</option>
                            <option value="position-desc">Position Descending</option>
                            <option value="id-asc">ID Ascending</option>
                            <option value="id-desc">ID Descending</option>
                            <option value="slug-asc">Slug Ascending</option>
                            <option value="slug-desc">Slug Descending</option>
                        </select>
                        
                        <div class="entriesContainer">
                            ${entriesHTML}
                        </div>
                    </div>
                `);

                setTimeout(setupEventHandlers, 0);
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
    });

    function setupEventHandlers() {
        function refreshEntriesDisplay() {
            const titleQuery = document.getElementById('searchTitleInput').value.toLowerCase();
            const contentQuery = document.getElementById('searchContentInput').value.toLowerCase();

            const entriesContainer = document.querySelector('.entriesContainer');
            const entries = Array.from(entriesContainer.children);

            entries.forEach(entryElement => {
                const index = entryElement.getAttribute('data-index');
                const entryData = entryDataCollection[index];

                const positionInfoElement = entryElement.querySelector('.position');
                if (positionInfoElement && entryData.homepage != true) {
                    positionInfoElement.remove();
                }

                const title = entryData.title.toLowerCase();
                const textToSearch = [entryData.notice, entryData.description, entryData.content].join(' ').toLowerCase();

                const isPublicChecked = document.getElementById('statePublic').checked;
                const isHiddenChecked = document.getElementById('stateHidden').checked;
                const isInternalChecked = document.getElementById('stateInternal').checked;

                let shouldDisplay = false;

                if (!isPublicChecked && !isHiddenChecked && !isInternalChecked) {
                    shouldDisplay = true;
                }

                if (isPublicChecked && entryData.state === 'public') {
                    shouldDisplay = true;
                }

                if (isHiddenChecked && entryData.state === 'hidden') {
                    shouldDisplay = true;
                }

                if (isInternalChecked && entryData.state === 'internal') {
                    shouldDisplay = true;
                }

                if (titleQuery && !title.includes(titleQuery)) {
                    shouldDisplay = false;
                }

                if (contentQuery && !textToSearch.includes(contentQuery)) {
                    shouldDisplay = false;
                }

                if (document.getElementById('noDescription').checked && entryData.description) {
                    shouldDisplay = false;
                }

                if (document.getElementById('noContent').checked && entryData.content) {
                    shouldDisplay = false;
                }

                if (document.getElementById('noMainLink').checked && entryData.mainLink) {
                    shouldDisplay = false;
                }

                if (document.getElementById('noSlug').checked && entryData.slug) {
                    shouldDisplay = false;
                }

                if (document.getElementById('homepage').checked && entryData.homepage != true) {
                    shouldDisplay = false;
                }

                entryElement.style.display = shouldDisplay ? 'flex' : 'none';
            });

            saveFiltersToSessionStorage();
            saveSearchInputsToSessionStorage();
        }

        // Search Listeners
        document.getElementById('searchTitleInput').addEventListener('keyup', refreshEntriesDisplay);
        document.getElementById('searchContentInput').addEventListener('keyup', refreshEntriesDisplay);

        // Filters Listeners
        const filters = document.querySelectorAll('.filter');
        filters.forEach(filter => {
            filter.addEventListener('change', refreshEntriesDisplay);
        });

        loadSearchInputsFromSessionStorage();
        loadFiltersFromSessionStorage();
        loadSortingOptionFromSessionStorage();

        refreshEntriesDisplay();
        SortEntries();

        // Sorting
        document.getElementById('sortOptions').addEventListener('change', SortEntries);

        function SortEntries(event) {
            const entriesContainer = document.querySelector('.entriesContainer');
            const entries = Array.from(entriesContainer.children);
            const selectElement = event ? event.target : document.getElementById('sortOptions');

            const order = selectElement.value.split('-');
            const [field, direction] = order;

            const sortedEntries = entries.sort((a, b) => {
                const indexA = a.getAttribute('data-index');
                const indexB = b.getAttribute('data-index');

                const entryA = entryDataCollection[indexA];
                const entryB = entryDataCollection[indexB];

                let comparison = 0;

                if (field === 'date') {
                    comparison = new Date(entryA[field]).getTime() - new Date(entryB[field]).getTime();
                } else if (typeof entryA[field] === 'number') {
                    comparison = entryA[field] - entryB[field];
                } else {
                    comparison = entryA[field].localeCompare(entryB[field]);
                }

                return direction === 'desc' ? -comparison : comparison;
            });

            entriesContainer.innerHTML = '';
            sortedEntries.forEach(entry => entriesContainer.appendChild(entry));

            saveSortingOptionToSessionStorage();
        }
    }

    function saveFiltersToSessionStorage() {
        const filters = document.querySelectorAll('.filter');
        const filterState = {};

        filters.forEach(filter => {
            filterState[filter.id] = filter.checked;
        });

        sessionStorage.setItem('filters', JSON.stringify(filterState));
    }

    function loadFiltersFromSessionStorage() {
        const savedFilters = JSON.parse(sessionStorage.getItem('filters'));

        if (savedFilters) {
            const filters = document.querySelectorAll('.filter');

            filters.forEach(filter => {
                filter.checked = savedFilters[filter.id] || false;
            });
        }
    }

    function saveSortingOptionToSessionStorage() {
        const selectedSortingOption = document.getElementById('sortOptions').value;
        sessionStorage.setItem('sortingOption', selectedSortingOption);
    }

    function loadSortingOptionFromSessionStorage() {
        const savedSortingOption = sessionStorage.getItem('sortingOption');

        if (savedSortingOption) {
            document.getElementById('sortOptions').value = savedSortingOption;
        }
    }

    function saveSearchInputsToSessionStorage() {
        const titleQuery = document.getElementById('searchTitleInput').value;
        const contentQuery = document.getElementById('searchContentInput').value;

        sessionStorage.setItem('titleQuery', titleQuery);
        sessionStorage.setItem('contentQuery', contentQuery);
    }

    function loadSearchInputsFromSessionStorage() {
        const savedTitleQuery = sessionStorage.getItem('titleQuery');
        const savedContentQuery = sessionStorage.getItem('contentQuery');

        if (savedTitleQuery !== null) {
            document.getElementById('searchTitleInput').value = savedTitleQuery;
        }

        if (savedContentQuery !== null) {
            document.getElementById('searchContentInput').value = savedContentQuery;
        }
    }
}