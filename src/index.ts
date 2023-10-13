import {setupConfig} from "./common/config"
import {createPage, startBrowser} from "./scraper/browser"

export async function setupScraper() {
    console.log("Starting setup for schedgeup-scraper...")
    setupConfig()
    await startBrowser()
    await createPage()
    console.log("Finished setup for schedgeup-scraper!")
}

export {EventIdAndDate, getEventInfos} from "./scraper/pages/schedule"
export {Worker, Event, scrapeEvents} from "./scraper/pages/eventAssignement"
export {scrapeUsers} from "./scraper/pages/users"
export {DateRange} from "./common/date"
