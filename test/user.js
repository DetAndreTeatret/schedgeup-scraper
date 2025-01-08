import {scrapeEvents, scrapeUsers, setupScraper, DateRange, getEventInfos} from "../dist/index.js"
import assert from "assert"
import dotenv from "dotenv"
import {afterDays} from "../dist/common/date.js"

// Pre test setup
dotenv.config()
await setupScraper()

// Disable undef rules since I won't bother looking up globals in Mocha context...
/* eslint-disable no-undef */

describe("#scrapeUsers", function () {
    it("Try to scrape users", async function () {
        this.timeout(60000)

        const users = await scrapeUsers()
        users.forEach(user => {
            assert.doesNotReject(user.phoneNumber)
        })
        console.dir(users, {colors: true})
    })
})

describe("#scrapeSchedule", function () {
    it("Try to scrape the next 7 days", async function () {
        this.timeout(60000)

        const result = await getEventInfos(new DateRange(new Date(), afterDays(7)), true)
        console.dir(result, {colors: true})

        const result2 = await scrapeEvents(result)
        console.dir(result2, {depth: null, colors: true})
    })
})
