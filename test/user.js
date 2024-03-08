import {scrapeUsers, setupScraper} from "../dist/index.js";
import assert from "assert";
import dotenv from "dotenv";
import {DateRange, getEventInfos} from "../dist/index.js";
import {afterDays} from "../dist/common/date.js";
import {inspect} from "node:util";

dotenv.config()
await setupScraper()

describe("#scrapeUsers", function () {
    it("Users with empty phone numbers should return null", async function () {
        this.timeout(60000)

        const users = await scrapeUsers()
        users.forEach(user => {
            assert.doesNotReject(user.phoneNumber)
        })
        assert(users.find(u => u.userId === "2845").phoneNumber === null)
    })
})

describe("#scrapeSchedule", function () {
    it("Try to scrape the current month", async function () {
        this.timeout(60000)

        const result = await getEventInfos(new DateRange(new Date(), afterDays(7)))
        console.log(inspect(result))
    })
})
