import Analytics from "../../Birdhouse/src/modules/analytics.js";
import { updateTitleAndMeta } from "../../Birdhouse/src/main.js";

export default async function Maintenance() {
    Analytics('Maintenance');
    updateTitleAndMeta('Maintenance');

    return `
        <div class="contentBox">
        <div class="textContent">
        <h1>This website is currently under maintenance. Please come back later.</h1>
        <p>If this website continues to be in maintenance mode, please feel free to <a href="/contact" class="underline">contact me</a>.</p>
        </div>
        </div>
    `;
}