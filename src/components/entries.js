import { isAdminPromise, urlPrefix, getRelativePath, action } from "../../Birdhouse/src/main.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";
import { markdown } from "../../Birdhouse/src/modules/markdown.js";
import InfiniteScroll from "../../Birdhouse/src/modules/infinite-scroll.js";

let entriesInSession = [];
let admin = false;
let index = 1;
export default async function Entries() {
    index = 1;
    Analytics('Showing Projects');

    action(setupEventHandlers);

    let entriesContent = '<div id="entriesContainer"></div>';

    return entriesContent;
}

async function displayEntries(entries) {
    console.log('displayEntries');
    let html = ''
    for (const entry of entries) {
        console.log('entry', entry);
        html += await displayEntry(entry);
    }
    return html;
}

function entryExistsInSession(entry) {
    return entriesInSession.some(e => e.id === entry.id);
}

async function displayEntry(entry) {
    entriesInSession = JSON.parse(sessionStorage.getItem('homepageEntries'));
    if (entriesInSession === null) {
        entriesInSession = [];
    }
    if (!entryExistsInSession(entry)) {
        entriesInSession.push(entry);
    } else {
        const index = entriesInSession.findIndex(e => e.id === entry.id);
        entriesInSession[index] = entry;
    }
    sessionStorage.setItem('homepageEntries', JSON.stringify(entriesInSession));

    let additionalLinks = '';

    if (Array.isArray(entry.additionalLinks)) {
        entry.additionalLinks.forEach(link => {
            if (link.link != '' && link.text != '') {
                additionalLinks += `
                                            <a href="${link.link}" class="entryLink button">${link.text}</a>
                                            `;
            }
        });
    }

    if (entry.slug) {
        /*additionalLinks += `
                                    <a href="/${entry.slug}" class="entryLink button">Read more</a>
                                    `;*/
        entry.mainLink = '/' + entry.slug;
    }

    let additionalClass = "";
    if (index % 2) {
        additionalClass = 'odd';
    }
    index++;

    let entryNotice = "";
    if (entry.notice != "") {
        entryNotice = `
                                <p class="entryNotice">${entry.notice}</p>
                                `;
    }

    let adminLink = "";
    if (admin) {
        adminLink = `<a href="${urlPrefix + '/entries?id=' + entry.id}" class="editEntry">Edit Entry</a>`;
    }

    return `
                <div id="${entry.title.replace(" ", "-")}" class="entrySection fade-in-fast ${additionalClass}">
                    <div class="entryBox">
                        <div class="entryImageBox"><a href="${entry.mainLink}" class="entryImageLink"><img src="uploads/${entry.image}" alt="${entry.title}" class="entryImage" loading="lazy"></a></div>
                        <div class="entryInfoBox">
                            <a href="${entry.mainLink}"><h2 class="entryTitle">${entry.title}</h2></a>
                            ${entryNotice}
                            <p class="entryDescription">${await markdown(entry.description)}</p>
                            <div class="entryLinks">
                                ${additionalLinks}
                            </div>
                        </div>
                    </div>
                    ${adminLink}
                </div>
            `;
}

const containerID = 'entriesContainer';
const fetchURL = `${urlPrefix}/database/get_entries.php?state=public&homepage`;
let infiniteScroll;
let container;

async function setupEventHandlers() {
    container = document.getElementById(containerID);
    entriesInSession = JSON.parse(sessionStorage.getItem('homepageEntries'));
    if (entriesInSession === null) {
        entriesInSession = [];
    }
    const limit = 3;
    const page = (entriesInSession.length > 0 && !admin) ? Math.ceil(entriesInSession.length / limit) : 1;
    infiniteScroll = InfiniteScroll({
        initialLimit: limit,
        add: 0,
        page: page,
        container: container,
        fetchURL: fetchURL,
        displayFunction: displayEntries,
        emptyMessage: 'Currently no entries available.'
    });

    await infiniteScroll.setup(false);

    admin = await isAdminPromise;
    if (admin) {
        sessionStorage.removeItem('homepageEntries');
    }
    if (entriesInSession) {
        container.innerHTML = await displayEntries(entriesInSession);
    }
}