import { alertPopup, alertPopupClose, updateTitleAndMeta } from "../../Birdhouse/src/main.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function MediaLibrary(standalone = true) {
    if (standalone) {
        Analytics('Showing Media Library');
        updateTitleAndMeta('Media Library', 'Media Library');
    }

    return new Promise((resolve, reject) => {
        fetch('./database/get_available_images.php')
            .then(response => response.json())
            .then(images => {
                let imageHTML = images.map(imageData => `
                    <div class= "imageWrapper" data-size-bytes="${imageData.size}">
                    <a href="#" class="filename copy-clipboard-link" data-md-element="${imageData.filename}">${imageData.filename}</a>
                    <img src="uploads/${imageData.filename}" alt="${imageData.filename}" class="choose-image-link" data-md-image="${imageData.filename}">
                    <div class="expandingSpacer"></div>
                    <div class="fileInfoContainer">
                        <span class="fileInfo fileSize">${bytesToSize(imageData.size)}</span>
                        <span class="fileInfo fileTimestamp">${imageData.timestamp}</span>
                    </div>
                        <div class="imageWrapperOptions">
                            <button class="delete-image" data-image="${imageData.filename}">Delete</button>
                        </div>
                    </div>
                `).join('');

                resolve(`
                    <div class="mediaLibrary">
        <h2>Media Library</h2>

        <form id="upload-image-form" enctype="multipart/form-data">
            <input type="file" id="new-image" name="new-image[]" multiple>
            <button type="submit">Upload the image(s)</button>
        </form>

        <input type="text" id="searchInput" placeholder="Search by file name"/>
        <select id="sortOptions">
            <option value="asc">Name Ascending</option>
            <option value="desc">Name Descending</option>
            <option value="date-asc">Date Ascending</option>
            <option value="date-desc">Date Descending</option>
            <option value="size-asc">Size Ascending</option>
            <option value="size-desc">Size Descending</option>
        </select>

        <div class="images">
            ${imageHTML}
        </div>
    </div >
                    `);


                setTimeout(setupEventHandlers, 0);
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
    });

    function setupEventHandlers() {

        function chooseImage(image) {
            const chosenImage = document.getElementById('chosenImage');
            if (chosenImage) {
                chosenImage.value = image;
                alertPopupClose();
            }
        }

        window.chooseImage = function chooseAnImage(image) {
            chooseImage(image);
        };

        document.body.addEventListener('click', function (event) {
            if (event.target.className === 'delete-image') {
                event.preventDefault();
                const image = event.target.getAttribute('data-image');
                console.log(image);
                fetch(`./database/delete_image.php?image=${image}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alertPopup('Image Deleted', 'The image has been successfully deleted.');
                            event.target.parentNode.parentNode.remove();
                        } else {
                            alertPopup('Deletion failed', 'Failed to delete image.');
                            console.error('Failed to delete image');
                        }
                    })
                    .catch(error => console.error(error));
            }
        });

        const uploadForm = document.getElementById('upload-image-form');
        uploadForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const formData = new FormData(uploadForm);
            const files = formData.getAll('new-image[]');

            if (files.length === 0) {
                console.error("No files selected.");
                return;
            }

            const filenames = files.map(file => file.name);

            const existencePromises = filenames.map(filename =>
                fetch(`./database/file_exists.php?filename=${filename}`)
                    .then(response => response.json())
            );

            Promise.all(existencePromises)
                .then(results => {
                    const existingFiles = results
                        .filter(result => result.fileExists)
                        .map((result, index) => filenames[index]);

                    if (existingFiles.length > 0) {
                        alertPopup('Override existing files?', `< p >
                    ${existingFiles.join(', ')} already exist.</p ><br>
                        <button id="abortImageOverride">Abort</button>
                        <button id="confirmImageOverride">Confirm</button>
                        `, false);

                        document.getElementById('confirmImageOverride').addEventListener('click', function () {
                            uploadImage(formData);  // If confirm, go ahead and upload
                        });

                        document.getElementById('abortImageOverride').addEventListener('click', function () {
                            alertPopupClose();  // If abort, just close the popup
                        });

                    } else {
                        uploadImage(formData);  // If no conflicts, proceed to upload
                    }
                })
                .catch(console.error);
        });

        document.querySelectorAll('.copy-clipboard-link').forEach(function (elem) {
            elem.addEventListener('click', function (e) {
                e.preventDefault();
                let element = this.dataset.mdElement;
                CopyToClipboard(element);
            });
        });

        document.querySelectorAll('.choose-image-link').forEach(function (elem) {
            elem.addEventListener('click', function (e) {
                e.preventDefault();
                let image = this.dataset.mdImage;
                chooseImage(image);
            });
        });

        // Searching
        document.getElementById('searchInput').addEventListener('keyup', function () {
            const query = this.value.toLowerCase();
            const imagesContainer = document.querySelector('.images');
            const images = Array.from(imagesContainer.children);

            images.forEach(image => {
                const name = image.querySelector('.filename').textContent;
                if (name.toLowerCase().includes(query)) {
                    image.style.display = "";
                } else {
                    image.style.display = "none";
                }
            });
        });

        // Sorting
        document.getElementById('sortOptions').addEventListener('change', function () {
            const imagesContainer = document.querySelector('.images');
            const images = Array.from(imagesContainer.children);
            const order = this.value; // get selected value from dropdown

            const sortedImages = images.sort((a, b) => {
                const nameA = a.querySelector('.filename').textContent;
                const nameB = b.querySelector('.filename').textContent;

                const sizeA = a.getAttribute('data-size-bytes');
                const sizeB = b.getAttribute('data-size-bytes');

                const dateA = new Date(a.querySelector('.fileTimestamp').textContent);
                const dateB = new Date(b.querySelector('.fileTimestamp').textContent);

                switch (order) {
                    case 'asc':
                        return nameA.localeCompare(nameB);
                    case 'desc':
                        return nameB.localeCompare(nameA);
                    case 'date-asc':
                        return dateA - dateB;
                    case 'date-desc':
                        return dateB - dateA;
                    case 'size-asc':
                        return sizeA - sizeB;
                    case 'size-desc':
                        return sizeB - sizeA;
                    default:
                        return 0;
                }
            });

            imagesContainer.innerHTML = '';
            sortedImages.forEach(image => imagesContainer.appendChild(image));
        });
    }

    function bytesToSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    function uploadImage(formData) {
        alertPopup('Uploading: Please wait', '<div class="loadingSymbol"></div>');

        const uploadPromises = Array.from(formData.getAll('new-image[]')).map(file => {
            const singleFileData = new FormData();
            singleFileData.append('new-image', file);

            return fetch('./database/upload_image.php', {
                method: 'POST',
                body: singleFileData,
            }).then(response => response.json());
        });

        Promise.all(uploadPromises)
            .then(responses => {
                responses.forEach(data => {
                    if (data.success) {
                        chooseImage(data.filename);
                        const newImageHTML = `
                        <div class="imageWrapper">
                            <a href="#" class="filename copy-clipboard-link" data-md-element="${data.filename}">${data.filename}</a>
                            <img src="uploads/${data.filename}" alt="${data.filename}" class="choose-image-link" data-md-image="${data.filename}">
                            <button class="delete-image" data-image="${data.filename}">Delete</button>
                        </div>
                        `;

                        const mediaLibrary = document.querySelector('.mediaLibrary .images');
                        if (mediaLibrary) {
                            mediaLibrary.insertAdjacentHTML('beforeend', newImageHTML);
                            const newElement = mediaLibrary.lastElementChild;
                            newElement.querySelector('.copy-clipboard-link').addEventListener('click', function (e) {
                                e.preventDefault();
                                let element = this.dataset.mdElement;
                                CopyToClipboard(element);
                            });
                            newElement.querySelector('.choose-image-link').addEventListener('click', function (e) {
                                e.preventDefault();
                                let image = this.dataset.mdImage;
                                chooseImage(image);
                            });
                        }
                    } else {
                        console.error('Upload of one or more files failed:', data.message);
                    }
                });
                alertPopup('Upload Complete', 'All images have been uploaded successfully.');
            })
            .catch(error => {
                alertPopup('Error', 'An error occurred during upload. Please try again.');
                console.error(error);
            });
    }
}