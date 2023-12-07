import {scrapeUsers, setupScraper} from "../dist/index.js";
import assert from "assert";
import dotenv from "dotenv";

describe("#scrapeUsers", function () {
    it("Users with empty phone numbers should return null", async function () {
        this.timeout(60000)
        dotenv.config()
        await setupScraper()

        const users = await scrapeUsers()
        users.forEach(user => {
            assert.doesNotReject(user.phoneNumber)
        })
        assert(users.find(u => u.userId === "2845").phoneNumber === null)
    })
})
