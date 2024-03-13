// Required imports
import * as main from "./Birdhouse/src/main.js";
import { displayError, clearError } from "./Birdhouse/src/modules/input-validation.js";
import { getSetting } from "./Birdhouse/src/modules/database-settings.js";

import Messages from "./src/messages.js";
import config from "./config.js";

window.hook('before-adding-base-content', async function (menuHTML) {
    const headerElement = document.getElementById("header");
    if (!headerElement) {
        return;
    }

    headerElement.innerHTML = menuHTML;
});

window.hook('get-popup-menu-html', async function (menuHTML) {
    return `
    <div id="menu" class="popup">
        <div class="menuList fade-down-menu">
            <a href="/"><img id="logo" class="logo" alt="Housebird Games" src="img/logos-originals/Housebird Games Logo Round With Name Compressed.png"></a>
            <br>
            ${menuHTML}
            <br>
            <button id="updateNotesButton" class="menu updateNotesButton">What's new?</button>
            <button class="menu openAcknowledgementButton">Cookies &amp; Storage</button>
            <br>
			<button class="closePopup menu"><span class="material-icons md-light spaceRight">close</span>Close</button>
		</div>
	</div>
    `;
});

window.hook('on-handle-route-change', async function () {
    main.popupManager.closePopup('menu');

    const headerElement = document.getElementById("header");
    const preheaderImageDuration = 5000;

    let showPreHeader = false;
    const path = main.normalizePath(window.location.pathname);

    if (path === main.urlPrefix + '/' || path === main.urlPrefix + '/index.html') {
        showPreHeader = true;
    }

    let preHeaderElement = document.getElementById('preHeader');
    if (showPreHeader) {
        preHeaderElement = preHeaderElement || createPreHeaderElement(headerElement);

        preHeaderElement.innerHTML = `
                        <div id="preHeaderImageWrap" class="preHeaderImageWrap">
                            <div class="preHeaderOverlay1"></div>
                            <div class="preHeaderOverlay2"></div>
                            <div class="preHeaderLogoWrap">
                                <img src="img/logos-originals/Housebird Games Logo Round With Name Compressed.png" class="preHeaderLogo" alt="Housebird Games Logo">
                                <h2>Creating fun, one game at a time</h2>
                            </div>
                        </div>
                        `;
    }
    else if (preHeaderElement) {
        preHeaderElement.classList.remove('extended');
    }

    function createPreHeaderElement(headerElement) {
        let preHeaderElement = document.createElement('div');
        preHeaderElement.id = 'preHeader';
        headerElement.parentNode.insertBefore(preHeaderElement, headerElement);
        preHeaderElement.classList.add('fade-in-fast');
        return preHeaderElement;
    }

    function getPreHeaderImages(preheader_images) {
        if (preheader_images == '') {
            return [];
        }
        return preheader_images.split(',');
    }

    function animateImage(index) {
        let img = document.getElementById(`img-${index}`);
        if (img) {
            img.onload = function () {
                img.style.animation = `fadeZoom ${preheaderImageDuration / 500}s ease-out`;
                img.addEventListener('animationend', () => {
                    img.style.animation = '';
                });
            };
            if (img.complete) {
                img.onload();
            }
        }
    }

    const logoImage = new Image();
    logoImage.src = "img/logos-originals/Housebird Games Logo Round With Name Compressed.png";
    logoImage.onload = function () {
        const preHeaderImageWrap = document.getElementById('preHeaderImageWrap');
        if (preHeaderImageWrap && headerElement) {
            getSetting('preheader_images').then(preheader_images => {
                if (showPreHeader) {
                    const images = getPreHeaderImages(preheader_images);
                    let imagesHTML = '';
                    if (images.length > 0) {
                        imagesHTML = images.map((image, index) => {
                            return `<img id="img-${index}" src="uploads/${image}" class="preHeaderImage" alt="">`;
                        }).join('');
                    }

                    let tempDiv = document.createElement('div');
                    tempDiv.innerHTML = imagesHTML;

                    while (tempDiv.firstChild) {
                        preHeaderImageWrap.insertBefore(tempDiv.firstChild, preHeaderImageWrap.children[0]);
                    }

                    let currentImageIndex = 0;

                    animateImage(currentImageIndex);

                    setInterval(() => {
                        currentImageIndex = (currentImageIndex + 1) % images.length;
                        animateImage(currentImageIndex);
                    }, preheaderImageDuration);

                    preHeaderElement.classList.add('extended')
                }
            }).catch(error => {
                console.error(error);
            });
        }
    }
});

window.hook('on-component-loaded', async function () {

});

window.hook('on-content-loaded', async function () {

});

window.hook('page-loaded', async function () {
    await onPageLoaded();
});

async function onPageLoaded() {
    main.addBaseContent(`
    <div id = "menu" class="popup">
		<div class="menuList fade-down-menu">
			<a href="https://housebird.games"><img id="logo" class="logo" alt="Housebird Games" src="img/logos-originals/Housebird Games Logo Round With Name Compressed.png"></></a>
			<br>
            <a href="${main.urlPrefix}/"><button class="button menu">Projects</button></a>
            <a href="${main.urlPrefix}/blog"><button class="button menu">Blog</button></a>
            <a href="https://stubenvogel.com"><button class="button menu">Felix T. Vogel</button></a>
            <br>
            <button id="updateNotesButton" class="menu updateNotesButton">What's new?</button>
			<button class="menu openAcknowledgementButton">Cookies & Storage</button>
            <br>
			<button class="closePopup menu">Close Menu</button>
            <!--<div class="menuFooter">
            <div class="linkRow">
            <a href="contact" class="underline">Contact</a>
            <a href="https://stubenvogel.com/impressum/" class="underline">Imprint</a>
            <a href="privacy-policy" class="underline">Privacy Policy</a>
            </div>
            </div>-->
		</div>
	</div>
    `);
}

window.hook('user-logged-in', async function () {
    location.reload();
});

window.hook('add-markdown-patterns', async function (html) {
    /* const examplePattern = /\[example_pattern\]/g;

    html = html.replace(examplePattern, await Example()); */

    return html;
});

window.hook('create-routes', async function () {
    main.createAdminRoute('/entries', 'New Entry', '', 'admin-components/entry-form.js');
    main.createAdminRoute('/entries-overview', 'Entries Overview', '', 'admin-components/entries-overview.js');
    main.createAdminRoute('/settings', 'Settings', '', 'admin-components/settings.js');
    main.createAdminRoute('/media-library', 'Media', '', 'admin-components/media-library.js');
    main.createAdminRoute('/analytics', 'Analytics', '', 'admin-components/analytics-overview.js');
    main.createAdminRoute('/logout', 'Logout', '', 'admin-components/logout.js');

    main.createPublicRoute('/', 'Projects', '', 'components/entries.js', true);
    main.createPublicRoute('/index.html', 'Projects', '', 'components/entries.js', false);
    main.createPublicRoute('/blog', 'Blog', '', 'components/blog.js', true);
    main.createPublicRoute('/privacy-policy', 'Privacy Policy', '', 'components/privacy-policy.js', false);
    main.createPublicRoute('/login', 'Login', '', 'components/login.js', false);
    main.createPublicRoute('/registration', 'Registration', '', 'components/registration.js', false);

    main.createPublicRoute('/contact', 'Contact', '', 'components/message.js', false, Messages.contact);
});

window.hook('get-cookies-list', async function () {
    let cookies = [
        'storageAcknowledgement',
        'lastUpdateNote',
        'PHPSESSID'
    ];

    return cookies;
});

window.hook('get-allowed-paths-during-maintenance', async function () {
    // Let's add some paths that are allowed during maintenance.

    let allowedPathsDuringMaintenance = [
        'login',
        'login-password',
        'logout',
        'contact',
        'privacy-policy',
        'terms-of-service'
    ];

    return allowedPathsDuringMaintenance;
});

window.hook('get-spa-excluded-links', async function () {
    // Let's add some routes that are excluded from the single page application route handling.

    let excludedRoutes = config.excludedPaths;

    return excludedRoutes;
});

window.hook('get-storage-acknowledgement-popup-content', async function () {
    // Let's add some content to the storage acknowledgement popup.

    const content = `
    <h1>Welcome!</h1>
    <p>By clicking "I Understand and Agree", you allow this site to store cookies on your device. These cookies are used to improve your experience:</p>
    <ul>
    <li>A cookie ensures that you won't see this message pop up on your subsequent visits or page reloads.</li>
    <li>Another cookie remembers which version of the website you last confirmed on the Update Notes, saving you from repeated alerts on every page load.</li>
    </ul>
    <p>These cookies are necessary for the smooth functioning of our site. If you choose to close this popup without clicking "I Understand and Agree", nothing will be stored. Thank you for your understanding!</p>
        `;

    return content;
});

window.hook('generate-menu-html', async function (menuItems) {
    // Here you can modify how the menuHTML is generated from the menu items that are created with createPublicRoute, createUserRoute and createAdminRoute.

    menuItems.push(
        {
            path: 'https://stubenvogel.com',
            name: 'Felix T. Vogel',
            displayFull: true,
            materialIcon: '',
        }
    )

    return menuItems
        .map(item => {
            let classes = 'wideMenuButton responsive headerButton';
            let extraHTML = '';
            if (item.materialIcon != '') {
                let additionClass = item.hasName ? "spaceRight" : "";
                extraHTML = `<span class="material-icons ${additionClass}">${item.materialIcon}</span>`;
            }
            return `<a href="${item.path}" class="${classes} text-${item.displayFull}">${extraHTML}<span class="linkText">${item.name}</span></a>`;
        })
        .join('') + `<button id="menuButton" class=""><i class="material-icons">menu</i></button>`;
});

window.hook('fetch-user-data', async function () {
    return await fetch('./database/get_user_status.php', {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
});

window.hook('check-remember-me', async function () {
    try {
        const response = await fetch('./database/remember_me.php');
        const text = await response.text();
        if (text.trim() === "Token accepted") {
            return true;
        }
    } catch (error) {
        console.error("Error checking remember me token:", error);
    }
    return false;
});

window.hook('get-maintenance-mode', async function () {
    let maintenanceResponse;
    try {
        maintenanceResponse = await fetch('./database/get_maintenance_mode.php', {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!maintenanceResponse.ok) {
            console.error(`HTTP error! status: ${maintenanceResponse.status}`);
            return false;
        }
        try {
            let maintenanceData = await maintenanceResponse.text();
            try {
                maintenanceData = JSON.parse(maintenanceData);
                if (maintenanceData.success) {
                    return maintenanceData.maintenanceMode;
                }
            } catch (jsonError) {
                console.error('An error occurred while parsing the JSON:', jsonError);
                console.error('Invalid JSON:', maintenanceData);
            }
        } catch (textError) {
            console.error('An error occurred while reading the response text:', textError);
        }
    } catch (fetchError) {
        console.error('An error occurred while fetching:', fetchError);
    }
    return false;
});

window.hook('add-dynamic-routes', async function (path) {
    const entriesResponse = await fetch(`./database/get_entries.php` + `?post=${path}`, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });


    let entries;
    try {
        const data = await entriesResponse.json();
        entries = data.items;
    } catch (error) {
        if (entriesResponse.status == 503) {
            console.log('503: Offline');
            route = findRoute('offline');
        }
        else {
            console.error('Failed to parse response as JSON:', error);
        }
    }

    if (entries && entries.length > 0) {
        main.createPublicRoute('/' + path.toLowerCase(), 'Entry', '', 'components/entry.js', false, entries);
        return true
    }
    return false;
});

window.hook('database-get-setting', async function (name, cacheSetting) {
    return await fetch('./database/get_setting.php' + '?name=' + encodeURIComponent(name), {
        cache: cacheSetting
    });
});

window.hook('database-set-setting', async function (name, value) {
    return fetch('./database/set_setting.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value })
    });
});

window.hook('send-analytics', async function (value) {
    const url = './database/analytics.php';
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ value: sanitizeInput(value) }),
    };

    fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response.text();
            }
        })
        .catch(error => {
            console.log('There has been a problem with your fetch operation: ' + error.message);
        });

    function sanitizeInput(value) {
        const sanitizedValue = value.replace(/(<([^>]+)>)/gi, '');

        return sanitizedValue;
    }
});

window.hook('validate-field', async function (input, value, errorElement, serverSide) {
});

window.hook('get-loading-content', async function () {
    return `
    <div class="entrySection fade-in-fast ">
			<div class="entryBox">
				<div class="entryImageBox skeleton pulsate"></div>
				<div class="entryInfoBox">
					<a href=""><h2 class="entryTitle skeleton pulsate">Example Project</h2></a>
					
					<p class="entryDescription skeleton pulsate">This is a skeleton loader. It is just an example of what this element would look like.</p>
					<div class="entryLinks">
						
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
					</div>
				</div>
			</div>
		</div>
		<div class="entrySection fade-in-fast odd">
			<div class="entryBox">
				<div class="entryImageBox skeleton pulsate"></div>
				<div class="entryInfoBox">
					<a href=""><h2 class="entryTitle skeleton pulsate">Example Project</h2></a>
					
					<p class="entryDescription skeleton pulsate">This is a skeleton loader. It is just an example of what this element would look like.</p>
					<div class="entryLinks">
						
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
					</div>
				</div>
			</div>
		</div>
		<div class="entrySection fade-in-fast ">
			<div class="entryBox">
				<div class="entryImageBox skeleton pulsate"></div>
				<div class="entryInfoBox">
					<a href=""><h2 class="entryTitle skeleton pulsate">Example Project</h2></a>
					
					<p class="entryDescription skeleton pulsate">This is a skeleton loader. It is just an example of what this element would look like.</p>
					<div class="entryLinks">
						
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
					</div>
				</div>
			</div>
		</div>
		<div class="entrySection fade-in-fast odd">
			<div class="entryBox">
				<div class="entryImageBox skeleton pulsate"></div>
				<div class="entryInfoBox">
					<a href=""><h2 class="entryTitle skeleton pulsate">Example Project</h2></a>
					
					<p class="entryDescription skeleton pulsate">This is a skeleton loader. It is just an example of what this element would look like.</p>
					<div class="entryLinks">
						
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
					</div>
				</div>
			</div>
		</div>
		<div class="entrySection fade-in-fast ">
			<div class="entryBox">
				<div class="entryImageBox skeleton pulsate"></div>
				<div class="entryInfoBox">
					<a href=""><h2 class="entryTitle skeleton pulsate">Example Project</h2></a>
					
					<p class="entryDescription skeleton pulsate">This is a skeleton loader. It is just an example of what this element would look like.</p>
					<div class="entryLinks">
						
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
									<a href="" class="entryLink button skeleton pulsate">Example</a>
									
					</div>
				</div>
			</div>
		</div>
    `;
});