import { alertPopup, getQueryParameterByName } from "../../Birdhouse/src/main.js";
import Analytics from "../../Birdhouse/src/modules/analytics.js";

export default async function Login() {
    Analytics('Showing Login Page');
    return `
    <div class="contentBox">
    <h2>Login</h2>
        <form action="database/login.php" method="post">
            <div>
                <label for="username">Username:
                <input type="text" id="username" name="username" required></label>
            </div>
            <div>
                <label for="password">Password:
                <input type="password" id="password" name="password" required></label>
            </div>
            <div>
                <label for="remember-me">Remember me:
                <input type="checkbox" id="remember-me" name="remember-me"></label>
            </div>
            <input type="submit" value="Login">
        </form>
        <p><strong>Note:</strong> The login requires <a href='#' class="openAcknowledgementButton underline">cookies and storage</a> to be allowed. If you choose to use the "Remember me" option, a cookie will be set to remember you.</p>
    </div>
    `;
}