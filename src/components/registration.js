import { getSetting } from "../../Birdhouse/src/modules/database-settings.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";
import { updateTitleAndMeta } from "../../Birdhouse/src/main.js";

export default async function Registration() {
    Analytics('Showing Registration Page');
    updateTitleAndMeta('Registration', 'Registration');
    const registration_enabled = await getSetting('registration_enabled', false);

    if (registration_enabled) {
        return `
            <div class="contentBox">
                <h2>Registration</h2>
                <p>Please note that this registration process is not necessary if you are not a part of Housebird Games. Data will be stored in a database, but you won't be able to log in or do anything else by being registered.</p>
                <form method="post" action="database/registration.php">
                <label>Username: <input type="text" name="username" required></label>
                <label>Password: <input type="password" name="password" minlength="8" required></label>
                <input type="submit" value="Register">
                </form>
            </div>
        `;
    } else {
        return `
            <div class="contentBox">
                <h2>Registration</h2>
                <p>Sorry, registration is currently closed.</p>
            </div>
        `;
    }
}