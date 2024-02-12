import { isAdminPromise, urlPrefix, getRelativePath } from "../../Birdhouse/src/main.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";
import { markdown } from "../../Birdhouse/src/modules/markdown.js";

export default async function Entries() {
    Analytics('Showing Projects');
    try {
        let entriesContent = '';

        let entries = null;
        const entriesInSession = sessionStorage.getItem('homepageEntries');
        const admin = await isAdminPromise;
        if (entriesInSession && !admin) {
            entries = JSON.parse(entriesInSession);
        } else {
            const entriesResponse = await fetch(getRelativePath('./database/get_entries.php') + '?state=public&homepage');
            entries = await entriesResponse.json();
            try {
                sessionStorage.setItem('homepageEntries', JSON.stringify(entries));
            } catch (e) {
                if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                    console.log('Failed to save entries in session storage: storage quota exceeded');
                } else {
                    throw e;
                }
            }
        }

        entries.reverse();


        let index = 0;
        for (let entry of entries) {
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

            entriesContent += `
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

        return entriesContent;
    } catch (error) {
        console.error(error);
        throw error;
    }
}