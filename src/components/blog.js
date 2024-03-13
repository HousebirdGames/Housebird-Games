import { isAdminPromise, urlPrefix, normalizePath, getRelativePath, updateTitleAndMeta } from "../../Birdhouse/src/main.js";
import { markdown } from "../../Birdhouse/src/modules/markdown.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function Blog(count = null) {
    Analytics('Showing Blog');

    const path = normalizePath(window.location.pathname);
    try {
        let entriesContent = '';

        if (count != null) {
            entriesContent += '<div class="readMoreSection"><h4>Do you want to read more?</h4>';
        }
        else {
            updateTitleAndMeta('Blog', 'Explore the creative journey behind game development with this blog. Get insights, updates, and sneak peeks into the released and upcoming games. Perfect for gaming enthusiasts and aspiring developers alike!')
        }

        let entries = null;
        const entriesInSession = sessionStorage.getItem('blogEntries');
        if (entriesInSession) {
            entries = JSON.parse(entriesInSession);
        } else {
            const entriesResponse = await fetch(getRelativePath('./database/get_entries.php') + '?state=public&allposts');
            const data = await entriesResponse.json();
            entries = data.items;
            try {
                sessionStorage.setItem('blogEntries', JSON.stringify(entries));
            } catch (e) {
                if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                    console.log('Failed to save entries in session storage: storage quota exceeded');
                } else {
                    throw e;
                }
            }
        }

        entries.reverse();
        const admin = await isAdminPromise;

        let index = 0;
        for (let entry of entries) {

            if (path.slice(urlPrefix.length + 1).toLowerCase() == entry.slug.toLowerCase()) {
                continue;
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

            entriesContent += `
                <div id="${entry.title.replace(" ", "-")}" class="blogSection fade-in-fast ${additionalClass}">
                    <div class="blogBox">
                        <a href="${urlPrefix + '/' + entry.slug}" class="blogImage bg-image-${entry.slug}"></a>
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

            if (count != null && index >= count) {
                break;
            }
        }

        if (count != null) {
            entriesContent += '</div>';
        }

        return entriesContent;
    } catch (error) {
        console.error(error);
        throw error;
    }
}