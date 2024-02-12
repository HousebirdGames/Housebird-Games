import { alertPopup, getQueryParameterByName, urlPrefix, updateTitleAndMeta } from "../../Birdhouse/src/main.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function Logout(updateTitle = true) {
    Analytics('Showing Logout Page');
    if (updateTitle) {
        updateTitleAndMeta('Logout');
    }

    return `
    <div class="contentBox accent">
    <h2><span class="material-icons md-light spaceRight">logout</span>Do you want to log out?</h2>
    <p>Click "Confirm" to log out on this browser. This will also invalidate your "Remember me"-Session in this browser.</p>
    <div class="panelButtons"><a href="${urlPrefix}/database/logout.php" class="highlight">Logout<span class="material-icons md-light spaceLeft">logout</span></a></div>
    </div>

    <div class="contentBox accent">
    <h2><span class="material-icons md-light spaceRight">delete_sweep</span>Do you want to delete all sessions?</h2>
    <p>The "Remember me"-checkbox (if checked on login) creates a session on the browser you are loggin in from.</p>
    <p>With a click on the button, the sessions on all browser will become invalid.</p>
    <p>The button does not logout any users that are currently logged in, but will prevent the automatic login functionality with the remember me function of the website.</p>
    <p>You can create new remembered sessions by checking the "Remember me"-checkbox on your next login on each browser.</p>
    <div class="panelButtons"><a href="${urlPrefix}/database/logout.php?all-devices=true" class="">Logout and delete all sessions<span class="material-icons md-light spaceLeft">logout</span></a></div>
    </div>
    `;
}