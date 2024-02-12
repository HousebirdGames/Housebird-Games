import Analytics from "../../Birdhouse/src/modules/analytics.js";
import { updateTitleAndMeta } from "../../Birdhouse/src/main.js";

export default async function Message(data) {
    const title = data.title || "Oups!";
    const message = data.message || "Something went wrong...";

    Analytics('Showing Message: ' + title);
    updateTitleAndMeta(title);
    return `
        <div class="contentBox">
        <div class="textContent">
        <h1>${title}</h1>
        <p>${message}</p>
        <br>
        <a class="button" href="/">Return to front page</a>
        </div>
        </div>
    `;
}