import { urlPrefix, isAdminPromise, updateTitleAndMeta } from "../../Birdhouse/src/main.js";
import { markdown } from "../../Birdhouse/src/modules/markdown.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function Entry(data) {
    const slug = window.location.pathname.split('/').pop();

    const entry = data.find(entry => entry.slug.toLowerCase() === slug.toLowerCase());
    Analytics(`Showing post: ${entry.title} (ID: ${entry.id})`);

    if (!entry) {
        window.location.replace(`${urlPrefix}/`);
        return '<div class="contentBox"><h1>404 Entry not Found</h1></div>';
    }

    const admin = await isAdminPromise;

    let adminLink = "";
    if (admin) {
        adminLink = `<a href="${urlPrefix + '/entries?id=' + entry.id}" class="editEntry">Edit Entry</a>`;
    }

    let content = await markdown('[p]' + await markdown(entry.description) + '[/p]');

    updateTitleAndMeta(entry.title, entry.description);

    if (entry.content != '') {
        content = await markdown(entry.content);
    }

    let additionalLinks = '';
    additionalLinks = '<div class="blogButtonWrap additionalLinks">';
    if (Array.isArray(entry.additionalLinks) && entry.additionalLinks.length > 0) {
        entry.additionalLinks.forEach(link => {
            if (link.link != '' && link.text != '') {
                additionalLinks += `
                <a href="${link.link}" class="entryLink button">${link.text}</a>
                                    `;
            }
        });
    }
    additionalLinks += `<a href="https://www.patreon.com/stubenvogel" class="entryLink button"><i class="material-icons topRight">favorite</i> Support me</a></div>`;

    content = `
    <div class="blogPost">
    <img src="uploads/${entry.image}" alt="${entry.title}" title="${entry.title}" class="blogPostImage">
    <h1 class="blogPostTitle">${entry.title}</h1>
    ${content}
    ${additionalLinks}
    </div>
    `;

    return adminLink + content;
}