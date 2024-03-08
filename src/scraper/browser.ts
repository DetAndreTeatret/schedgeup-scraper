import puppeteer, {Browser, Page} from "puppeteer"
import {loginSchedgeUp} from "./pages/login.js"
import {Mutex, MutexInterface, Semaphore} from "async-mutex";

let schedgeUpPage: Page
let browser: Browser

/**
 * @internal
 */
export async function startBrowser() {
    console.log("Starting puppeteer browser...")
    browser = await puppeteer.launch({
        headless: true,
        args: ["--disable-setuid-sandbox"],
        ignoreHTTPSErrors: true,
    })

}

/**
 * @internal
 */
export async function createPage() {
    const page = await browser.newPage()
        // Stop images/css/fonts from loading
        await page.setRequestInterception(true)
        page.on("request", (req) => {
            if (
                req.resourceType() === "image" ||
                req.resourceType() === "font" ||
                req.resourceType() === "stylesheet"
            ) {
                req.abort()
            } else {
                req.continue()
            }
        })

        // Forward relevant console info from browser console to node console
        page.on("console", message => {
            if (message.type() === "info") {
                console.info("[Puppeteer INFO]" + message.text())
            }
        })

        // Minimize display size
        await page.setViewport({
            width: 640,
            height: 480,
        })

        page.setDefaultNavigationTimeout(1000 * 60)
    if (schedgeUpPage === undefined) {
        schedgeUpPage = page
        await loginSchedgeUp(schedgeUpPage)
    }
    return page
}

const mutex = new Mutex()
class PageAndReleaser {
    page: Page
    release: MutexInterface.Releaser


    constructor(page: Page, release: MutexInterface.Releaser) {
        this.page = page;
        this.release = release;
    }
}
/**
 * @internal
 */
export async function getSchedgeUpPage() {
    if (schedgeUpPage === undefined) {
        throw new Error("SchedgeUp page is not yet initialized...")
    }

    const releaser = await mutex.acquire()
    return new PageAndReleaser(schedgeUpPage, releaser)
}

/**
 * @internal
 */
export async function navigateToUrl(page: Page, url: string, tryCount?: number) {
    console.log("Navigating to " + url + "...")
    try {
        await page.goto(url, {waitUntil: "networkidle2"})
    } catch (e) {
        console.log("Error while trying to navigate to " + url + ": " + e)
        const currentTry = tryCount === undefined ? 0 : tryCount
        if (currentTry > 3) {
            throw new Error("Failed to navigate to url " + url + " after 3 retries :(")
        }
        console.log("Retrying...(" + tryCount + "/3)")
        await navigateToUrl(page, url, currentTry + 1)
    }
}
