import { isAdminPromise, urlPrefix, normalizePath, getRelativePath, updateTitleAndMeta, action } from "../../Birdhouse/src/main.js";
import { markdown } from "../../Birdhouse/src/modules/markdown.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";
import InfiniteScroll from "../../Birdhouse/src/modules/infinite-scroll.js";

let admin = false;
let index = 1;
let maxIndex = 0;
export default async function Blog(count = null) {
    admin = await isAdminPromise;

    index = 1;
    maxIndex = 0;
    if (count != null) {
        maxIndex = count;
    }
    else {
        Analytics('Showing Blog');
    }

    action(setupEventHandlers);

    let entriesContent = '<div id="blogEntriesContainer"></div>';

    if (count != null) {
        entriesContent = '<div class="readMoreSection"><h4>Do you want to read more?</h4><div id="blogEntriesContainer"></div></div>'
    }

    return entriesContent;
}

async function displayEntries(entries) {
    let html = ''
    for (const entry of entries) {
        html += await displayEntry(entry);
    }

    let styleSheet = null;

    if (document.styleSheets.length > 1) {
        styleSheet = document.styleSheets[1];
    } else {
        let style = document.createElement('style');
        document.head.appendChild(style);
        styleSheet = style.sheet;
    }

    entries.forEach(entry => {
        styleSheet.insertRule(`.bg-image-${entry.slug} { background-image: url('uploads/${entry.image}'); }`, styleSheet.cssRules.length);
    });

    return html;
}

async function displayEntry(entry) {
    if (maxIndex > 0 && index > maxIndex) {
        infiniteScroll.teardown();
        return '';
    }

    if (normalizePath(window.location.pathname).slice(urlPrefix.length + 1).toLowerCase() == entry.slug.toLowerCase()) {
        return '';
    }

    let additionalClass = "";
    if (index % 2) {
        additionalClass = 'odd';
    }
    index++;

    let entryNotice = "";
    /*if (entry.notice != "") {
        entryNotice = `
                    <p class="entryNotice">${entry.notice}</p>
                    `;
    }*/

    let adminLink = "";
    if (admin) {
        adminLink = `<a href="${urlPrefix + '/entries?id=' + entry.id}" class="editEntry">Edit Entry</a>`;
    }

    const description = await markdown(entry.description)

    return `
    <div id="${entry.title.replace(" ", "-")}" class="blogSection fade-in-fast ${additionalClass}">
        <div class="blogBox">
            <a href="${urlPrefix + '/' + entry.slug}" class="blogImage bg-image-${entry.slug}" aria-label="Read the blog post: ${entry.title}" alt="Image for the Post: ${entry.title}"></a>
            <div class="blogInfoBox">
                <a href="${urlPrefix + '/' + entry.slug}"><h2 class="entryTitle">${entry.title}</h2></a>
                ${entryNotice}
                <p class="entryDescription">${description.substring(0, 150)}...</p>
                <div class="entryLinks">
                <a href="${urlPrefix + '/' + entry.slug}" class="entryLink readMore underline">Read more <i class="material-icons">double_arrow</i></a>
                </div>
            </div>
        </div>
        ${adminLink}
    </div>
`;
}

const containerID = 'blogEntriesContainer';
const fetchURL = `${urlPrefix}/database/get_entries.php?state=public&allposts`;
let infiniteScroll;
let container;

async function setupEventHandlers() {
    container = document.getElementById(containerID);
    const limit = 5;
    const page = 1;
    infiniteScroll = InfiniteScroll({
        initialLimit: limit,
        add: 0,
        page: page,
        container: container,
        fetchURL: fetchURL,
        displayFunction: displayEntries,
        storageType: admin ? null : 'session',
        emptyMessage: 'Currently no entries available.'
    });

    await infiniteScroll.setup(false);
}