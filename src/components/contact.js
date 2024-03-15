import { updateTitleAndMeta, urlPrefix, redirectUserToDashboard, getQueryParameterByName, alertPopup, popupManager, action } from "../../Birdhouse/src/main.js";

export default async function Contact() {
    action(setupEventHandlers);

    return `
    <div id="" class="contentBox">
            <h2><span class="material-icons md-light spaceRight">mail</span>Contact</h2>

            <form method="post" id="contactForm" action="database/mail/contact_form.php">
            
            <label>Name
            <input type="text" minlength="3" maxlength="255" class="field" name="name" value="" placeholder="How can I call you?" spellcheck="false" required></label>

            <label for="email">Email Address
            <input type="email" class="field" maxlength="255" id="email" name="email" placeholder="address@example.com" spellcheck="false" required></label>

            <div class="displayNone">
            <input name="email_confirm" type="email" value="" placeholder="Confirm your email address here" spellcheck="false">
            </div>

            <label>Your Message
            <textarea type="text" minlength="50" maxlength="1000" class="field" name="message" id="contactMessage" value="" placeholder="Write your message here" required></textarea></label>
            
            <label class="centerInput left">
            <input type="checkbox" id="consent" name="consent" required>
            <p>I acknowledge that I have read and understand the <a href="${urlPrefix}/privacy-policy" class="underline">Privacy Policy</a> for this experimental website.</p>
            </label>

            <input type="submit" value="Send now" class="highlight"></input>
            </form>

            <p>Alternatively you can write an email to <a href="mailto:contact@housebird.games" class="underline noShift">contact@housebird.games</a></p>
        </div>

    </div>  
    `;
}

function setupEventHandlers() {
    const form = document.getElementById('contactForm');
    const submitButton = form.querySelector('input[type="submit"]');
    const messageTextarea = document.getElementById('contactMessage');

    messageTextarea.addEventListener('paste', function (e) {
        e.preventDefault();
        alertPopup('Paste functionality has been disabled for this field');
    });

    form.onsubmit = async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        if (!email) {
            alertPopup('We require your email address to contact you');
            return false;
        }

        const contactMessage = document.getElementById('contactMessage').value;
        if (!contactMessage) {
            alertPopup('Your message is empty');
            return false;
        }

        submitButton.disabled = true;
        submitButton.value = 'Sending...';

        try {
            const formData = new FormData(form);

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alertPopup(result.message);
                form.reset();
            } else {
                alertPopup(result.message || 'An error occurred while submitting the message');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alertPopup('An error occurred while submitting the message');
        } finally {
            submitButton.disabled = false;
            submitButton.value = 'Send now';
        }
    };
}