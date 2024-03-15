import MediaLibrary from "../admin-components/media-library.js";
import { alertPopup, updateTitleAndMeta } from "../../Birdhouse/src/main.js";
import { getSetting, setSetting } from "../../Birdhouse/src/modules/database-settings.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function Settings() {
    Analytics('Showing Settings');
    updateTitleAndMeta('Admin Settings', 'Admin Settings');
    setTimeout(setupEventHandlers, 0);
    return `
    <div class="contentBox">
        <h2>Settings</h2>
        <form id="settingsForm" method="post">
            <fieldset>
            <label for="maintenanceMode">
                Maintenance Mode:
                <input type="checkbox" id="maintenanceMode" name="maintenanceMode">
            </label>
            <label for="registration">
                Registration Enabled:
                <input type="checkbox" id="registration" name="registration">
            </label>
            <label for="contactForm" class="centerInput left">
                <input type="checkbox" id="contactForm" name="contactForm">
                <p>Contact Form Enabled</p>
            </label>
            <label for="preheaderImages">
                Preheader Images (one per line):
                <textarea id="preheaderImages" name="preheaderImages"></textarea>
                <button type="button" id="openMediaLibraryButton">Choose from Media Library</button>
            </label>
            <button type="submit" value="Save">Save</button>
            </fieldset>
        </form>
        <br>
        <button type="button" id="logoutAllButton" class="">Logout from all Devices</button>
        <p><strong>Note:</strong> Active session will stay logged in, but the remember me sessions are invalidated.</p>
    </div>
    `;
}

function setupEventHandlers() {
    console.log('settings.js loaded');
    const settingsForm = document.getElementById('settingsForm');
    const maintenanceCheckbox = document.getElementById('maintenanceMode');
    const registrationCheckbox = document.getElementById('registration');
    const contactFormCheckbox = document.getElementById('contactForm');
    const preheaderImages = document.getElementById('preheaderImages');

    const mediaLibraryButton = document.getElementById('openMediaLibraryButton');
    if (mediaLibraryButton) {
        mediaLibraryButton.addEventListener('click', () => {
            MediaLibrary().then((html) => {
                alertPopup('', html);
            });
        });
    }

    const logoutAllButton = document.getElementById("logoutAllButton");
    logoutAllButton.onclick = function () {
        window.location.href = `./database/logout.php?all-devices=true`;
    };

    if (settingsForm) {
        Promise.all([
            getSetting('maintenance_mode', false),
            getSetting('registration_enabled', false),
            getSetting('preheader_images', false),
            getSetting('contact_form_enabled', false),
        ]).then(([maintenance_mode, registration_enabled, contact_form_enabled, preheader_images]) => {
            maintenanceCheckbox.checked = maintenance_mode;
            registrationCheckbox.checked = registration_enabled;
            contactFormCheckbox.checked = contact_form_enabled;

            let images = [];

            if (preheader_images && typeof preheader_images === "string") {
                images = preheader_images.split(',');
            }

            if (preheaderImages && images.length > 0) {
                preheaderImages.value = images.join('\n');
            }

            settingsForm.addEventListener('submit', (event) => {
                event.preventDefault();

                const newSettings = {
                    maintenance_mode: maintenanceCheckbox.checked,
                    registration_enabled: registrationCheckbox.checked,
                    contact_form_enabled: contactFormCheckbox.checked,
                    preheader_images: preheaderImages.value.split('\n').filter(image => image.trim() !== '').join(','),
                };

                Promise.all([
                    setSetting('maintenance_mode', newSettings.maintenance_mode),
                    setSetting('registration_enabled', newSettings.registration_enabled),
                    setSetting('contact_form_enabled', newSettings.contact_form_enabled),
                    setSetting('preheader_images', newSettings.preheader_images),
                ]).then(() => {
                    alertPopup('Done', "Settings updated successfully");
                });
            });
        }).catch(error => {
            console.error(error);
            alertPopup('Error', error);
        });
    }
}