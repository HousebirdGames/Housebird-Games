import MediaLibrary from "../admin-components/media-library.js";
import EntriesOverview from "../admin-components/entries-overview.js";
import { alertPopup, alertPopupClose, urlPrefix, getRelativePath, updateTitleAndMeta } from "../../Birdhouse/src/main.js";
import { markdownElements } from "../../Birdhouse/src/modules/markdown.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function EntryForm() {
    Analytics('Showing Entry Form');
    updateTitleAndMeta('Edit Entry', 'Edit the entries');

    return new Promise((resolve, reject) => {
        const entriesPromise = fetch('./database/get_entries.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch entries');
                }

                return response.json();
            });

        Promise.all([entriesPromise])
            .then(([existingEntriesResponse]) => {
                existingEntriesResponse.items.sort((a, b) => a.title.localeCompare(b.title));

                resolve(buildFormContent(existingEntriesResponse.items));

                setTimeout(setupEventHandlers, 0);
            })
            .catch(error => reject(error));
    });
}

function setupEventHandlers() {
    const form = document.getElementById('entryForm');
    form.addEventListener('submit', submitForm);

    console.log('entries.js loaded');

    const entriesOverviewButton = document.getElementById('openEntriesOverviewButton');
    if (entriesOverviewButton) {
        entriesOverviewButton.addEventListener('click', () => {
            EntriesOverview(false).then((html) => {
                alertPopup('', html, true, 'widePopupContent');
            });
        });
    }

    const mediaLibraryButton = document.getElementById('openMediaLibraryButton');
    if (mediaLibraryButton) {
        mediaLibraryButton.addEventListener('click', () => {
            MediaLibrary(false).then((html) => {
                alertPopup('', html, true, 'widePopupContent');
            });
        });
    }

    const existingEntryDropdown = document.getElementById('existingEntry');
    existingEntryDropdown.addEventListener('change', function () {
        loadEntryData(this.value);
    });

    const additionalLinksButton = document.getElementById('additionalLinksButton');
    additionalLinksButton.addEventListener('click', addLink);

    const duplicateButton = document.getElementById('duplicateButton');
    duplicateButton.addEventListener('click', duplicateEntry);

    const deleteButton = document.getElementById('deleteButton');
    deleteButton.addEventListener('click', deleteEntry);

    const homepageCheckbox = document.getElementById('homepage');
    const positionLabel = document.querySelector("label[for='position']");

    positionLabel.style.display = homepageCheckbox.checked ? '' : 'none';

    homepageCheckbox.addEventListener('change', function () {
        positionLabel.style.display = this.checked ? '' : 'none';
    });

    let params = new URLSearchParams(document.location.search.substring(1));
    let entryId = params.get("id");

    if (entryId) {
        loadEntryData(entryId);
    }

    document.querySelectorAll('.copy-to-clipboard').forEach(function (elem) {
        elem.addEventListener('click', function (e) {
            e.preventDefault();
            let element = this.dataset.mdElement;
            CopyToClipboard(element, false);
        });
    });
}

function buildFormContent(existingEntries) {
    let markdownCopyLinks = '';

    for (let elementName in markdownElements) {
        let element = markdownElements[elementName];
        let linkHTML = `<a href="#" data-md-element="${element}" class="filename copy-to-clipboard">${elementName}</a>`;
        markdownCopyLinks += linkHTML;
    }

    return `
        <div class="contentBox">
            <form id="entryForm" action="database/add_entry.php" method="post" enctype="multipart/form-data">
                <fieldset>
                <button type="button" id="openEntriesOverviewButton">Entries Overview</button>
                <select id="existingEntry" name="existingEntry">
                <option value="">New entry</option>
                ${existingEntries.map(entry => `<option value="${entry.id}">${entry.title}</option>`).join('')}
                </select>
                </fieldset>    
                <fieldset>
                <label for="entryId">Entry ID:
                <input type="int" id="entryId" name="entryId" readonly>
                </label>
                <label for="title">Title:
                <input type="text" id="title" name="title" required>
                </label>
                <label for="title">Slug:
                <input type="text" id="slug" name="slug">
                </label>
                <label for="description">Description:
                <textarea id="description" name="description"></textarea>
                </label>
                <label for="image">Image:
                <input type="text" id="chosenImage" name="chosenImage">
                </label>
                <button type="button" id="openMediaLibraryButton">Choose from Media Library</button>
                <label for="content">Content:
                <textarea id="contentTextarea" name="content"></textarea>
                </label>
                <div class="markdownElements">
                ${markdownCopyLinks}
                </div>
                <label for="mainLink">Main Link:
                <input type="text" id="mainLink" name="mainLink">
                </label>
                <label for="notice">Notice:
                <input type="text" id="notice" name="notice">
                </label>
                <label for="additionalLinks">Additional Links:
                <div id="additionalLinks">
                </div>
                <button type="button" id="additionalLinksButton">Add another link</button>
                </label>
                <label for="homepage">
                Is this a homepage entry:
                <input type="checkbox" id="homepage" name="homepage" value="1">
                </label>
                <label for="position">Position:
                <input type="number" id="position" name="position">
                </label>
                <label for="date">Date:
                <input type="date" id="date" name="date">
                </label>
                <label for="published">Published:
                <select id="state" name="state">
                <legend>Set the state of this entry</legend>
                <option value="hidden">Hidden</option>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
                </select>
                </label>
            </fieldset>
            <input type="submit" id="submitButton" value="Submit">
            </form>
            <button id="duplicateButton">Duplicate</button>
            <button id="deleteButton">Delete</button>
        </div>
    `;
}

function submitForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    fetch('database/add_entry.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Entry saved successfully');
                alertPopup('Success', 'Entry saved successfully');
                loadEntryData(data.id);
            } else {
                console.error('Failed to save the entry:', data.error);
                alertPopup('Error', 'Failed to save the entry');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alertPopup('Error', 'Failed to save the entry');
        });
}

function loadEntryData(entryId) {
    let websiteUrlSlug = document.getElementById('websiteUrlSlug');
    if (websiteUrlSlug == null) {
        websiteUrlSlug = document.createElement('a');
        websiteUrlSlug.id = 'websiteUrlSlug';
        websiteUrlSlug.className = "filename";
    }

    if (entryId !== "") {
        fetch(getRelativePath('./database/get_entry.php') + `?id=${entryId}`, {
            cache: 'no-store'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch the entry data');
                }
                return response.json();
            })
            .then(entryData => {
                history.replaceState({}, '', `?id=${entryId}`);

                refreshExistingEntries(entryId);

                document.getElementById('existingEntry').value = entryId;
                document.getElementById('entryId').value = entryData.id;
                document.getElementById('title').value = entryData.title;
                document.getElementById('slug').value = entryData.slug;
                document.getElementById('slug').value = document.getElementById('slug').value.toLowerCase();
                document.getElementById('notice').value = entryData.notice;
                document.getElementById('chosenImage').value = entryData.image;
                document.getElementById('description').value = entryData.description;
                document.getElementById('contentTextarea').value = entryData.content;
                document.getElementById('mainLink').value = entryData.mainLink;
                document.getElementById('homepage').checked = entryData.homepage;
                document.getElementById('position').value = entryData.position;
                document.getElementById('date').value = entryData.date;

                const positionLabel = document.querySelector("label[for='position']");
                positionLabel.style.display = entryData.homepage ? '' : 'none';

                websiteUrlSlug.textContent = window.location.origin + urlPrefix + '/' + entryData.slug;
                websiteUrlSlug.onclick = function () {
                    CopyToClipboard(window.location.origin + urlPrefix + '/' + entryData.slug);
                    return false;
                };
                if (entryData.slug == '') {
                    websiteUrlSlug.remove();
                }
                else {
                    const slugElement = document.getElementById('slug');
                    slugElement.parentNode.insertBefore(websiteUrlSlug, slugElement.nextSibling);
                }


                window.chooseImage = function chooseImage(image) {
                    window.opener.document.getElementById('existingImage').value = image;
                    window.close();
                }

                document.getElementById('state').value = entryData.state;
                var deleteButton = document.getElementById('deleteButton');
                deleteButton.style.display = "block";
                deleteButton.dataset.entryId = entryData.id;
                document.getElementById('submitButton').value = "Update";

                var duplicateButton = document.getElementById('duplicateButton');
                duplicateButton.style.display = "block";
                duplicateButton.dataset.entryId = entryData.id;

                const additionalLinks = document.getElementById('additionalLinks');
                additionalLinks.innerHTML = "";
                entryData.additionalLinks.forEach((link, index) => {
                    const linkDiv = document.createElement('div');
                    linkDiv.classList.add('additionalLinksWrapper');

                    const linkText = document.createElement('input');
                    linkText.type = "text";
                    linkText.name = `additionalLinks[${index}][text]`;
                    linkText.value = link.text;
                    linkText.placeholder = 'Text';

                    const linkUrl = document.createElement('input');
                    linkUrl.type = "text";
                    linkUrl.name = `additionalLinks[${index}][link]`;
                    linkUrl.value = link.link;
                    linkUrl.placeholder = 'URL';

                    linkDiv.appendChild(linkText);
                    linkDiv.appendChild(linkUrl);

                    additionalLinks.appendChild(linkDiv);
                });
            })
            .catch(error => console.error(error));
    } else {
        history.replaceState({}, '', `?id=${entryId}`);
        document.getElementById('entryForm').reset();
        websiteUrlSlug.remove();
        document.getElementById('entryId').value = "";
        document.getElementById('deleteButton').style.display = "none";
        document.getElementById('submitButton').value = "Submit";
    }
}

async function refreshExistingEntries(currentID) {
    try {
        const response = await fetch('./database/get_entries.php');
        if (!response.ok) {
            throw new Error('Failed to fetch entries');
        }
        const responseJson = await response.json();
        const existingEntries = responseJson.items;
        const existingEntriesDropdown = document.getElementById('existingEntry');
        existingEntriesDropdown.innerHTML = '<option value="">New entry</option>' + existingEntries.map(entry => `<option value="${entry.id}">${entry.title}</option>`).join('');
        existingEntriesDropdown.value = currentID;
    } catch (error) {
        console.error(error);
    }
}

function deleteEntry() {
    var deleteButton = document.getElementById('deleteButton');
    var id = deleteButton.dataset.entryId;

    alertPopup('Delete Entry?', `
    <button id="abortDelete">Abort</button>
    <button id="confirmDelete">Confirm</button>
`, false);

    const abortDelete = document.getElementById('abortDelete');
    abortDelete.addEventListener('click', () => {
        alertPopupClose();
    });

    const confirmDelete = document.getElementById('confirmDelete');
    confirmDelete.addEventListener('click', () => {
        fetch('./database/delete_entry.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Entry deleted successfully');
                    location.reload();
                } else {
                    console.error('Failed to delete the entry:', data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });
}

function addLink() {
    const additionalLinks = document.getElementById('additionalLinks');
    const newLinkDiv = document.createElement('div');
    newLinkDiv.classList.add('additionalLinksWrapper');

    const linkText = document.createElement('input');
    linkText.type = "text";
    linkText.name = `additionalLinks[${additionalLinks.children.length}][text]`;
    linkText.placeholder = 'Text';

    const linkUrl = document.createElement('input');
    linkUrl.type = "text";
    linkUrl.name = `additionalLinks[${additionalLinks.children.length}][link]`;
    linkUrl.placeholder = 'URL';

    newLinkDiv.appendChild(linkText);
    newLinkDiv.appendChild(linkUrl);

    additionalLinks.appendChild(newLinkDiv);
}

function duplicateEntry() {
    var id = duplicateButton.dataset.entryId;
    fetch(`./database/get_entry.php?id=${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch the entry data');
            }
            return response.json();
        })
        .then(entryData => {
            document.getElementById('entryId').value = "";
            document.getElementById('title').value = entryData.title;
            document.getElementById('slug').value = entryData.slug;
            document.getElementById('deleteButton').style.display = "none";

            document.getElementById('submitButton').value = "Create";
        })
        .catch(error => console.error(error));
}