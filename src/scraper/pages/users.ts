import {Page} from "puppeteer"
import {getSchedgeUpPage, navigateToUrl} from "../browser.js"
import {EnvironmentVariable, needEnvVariable} from "../../common/config.js"
import {AsYouType} from "libphonenumber-js"

class SchedgeUpUser {
    userId: string
    displayName: string
    roles: string[]
    groups: string[]
    phoneNumber: string | null
    emailAddress: string

    constructor(userId: string, displayName: string, roles: string[], groups: string[], phoneNumber: string | null, emailAddress: string) {
        this.userId = userId
        this.displayName = displayName
        this.roles = roles
        this.groups = groups
        this.phoneNumber = phoneNumber
        this.emailAddress = emailAddress
    }
}

/**
 * Scrape users from the "All Users" page, alternatively pass an array of user ids to include to discard any unnecessary users
 * @param users user ids to include in the result, will ignore all users not included in this array if present
 */
export async function scrapeUsers(users?: string[]): Promise<SchedgeUpUser[]> {
    const page = getSchedgeUpPage()
    await navigateToUsers(page)

    return JSON.parse(await page.$eval(".infoTable", (result, userIds) => {

        const users: SchedgeUpUser[] = []

        class SchedgeUpUser {
            userId: string
            displayName: string
            roles: string[]
            groups: string[]
            phoneNumber: string
            emailAddress: string

            constructor(userId: string, displayName: string, roles: string[], groups: string[], phoneNumber: string, emailAddress: string) {
                this.userId = userId
                this.displayName = displayName
                this.roles = roles
                this.groups = groups
                this.phoneNumber = phoneNumber
                this.emailAddress = emailAddress
            }
        }

        /**
         * A user row should consist of these 8 data cell elements(<td>)("contains" implies element.innerText):
         * 0. Cell containing only the row number of the current user row
         * 1. Cell containing only the display name of the user
         * 2. Cell containing an element that contains the telephone number of the user, if any exists(empty returns "")
         * 3. Cell containing an element that contains the mail address of the user
         * 4. Cell containing an element that contains a calendar icon, which has a href to the schedule for the given user
         * 5. Cell containing an element that contains a birthday cake icon, which has a href to the page of all theatre birthdays
         * 6. Cell containing an element that contains a camera icon, which has a href to the affiliations page of the user
         * 7. Cell containing an element that contains a pencil icon, which has a href to the affiliations page of the user
         * @param element user element as described above
         */
        function parseUser(element: Element) {
            const cells = element.children

            const displayName = (needNotNull(cells.item(1), "user td 1") as HTMLElement).innerText

            // @ts-ignore
            const id = needNotNull(cells.item(4), "user td 4").firstChild.href.split("=")[1]
            if(userIds !== undefined && !userIds.includes(id)) return null
            // @ts-ignore
            const phoneNumber = needNotNull(cells.item(2), "user td 2").firstChild.innerText
            // @ts-ignore
            const emailAddress = needNotNull(cells.item(3), "user td 2").firstChild.innerText

            return new SchedgeUpUser(id, displayName, [], [], phoneNumber === "" ? "undefined" : phoneNumber, emailAddress) // TODO: Roles and groups
        }

        function needNotNull<T>(object: T | null, whatIsTheObject: string) {
            if (object == null) {
                throw new Error("object needs to be not null and is in fact, null: " + whatIsTheObject)
            }

            return object
        }

        const tableBody = result.children.item(0)
        if (tableBody == null) {
            throw new Error("Illegal state, table body was not found")
        }

        console.info("Found " + tableBody.children.length + " users, parsing...")
        for (let i = 0; i < tableBody.children.length; i++) {
            const tableItem = tableBody.children.item(i)
            if (tableItem == null) {
                throw new Error("Illegal state, the for loop in JavaScript is broken...")
            }

            const user = parseUser(tableItem)
            if (!user) continue
            console.info("Found user " + user.displayName + "(" + user.userId + ")")
            users.push(user)
        }

        return JSON.stringify(users)
    }, users), (key, value) => {
        if (key === "phoneNumber") {
            if(value === "undefined") return null
            let sanitizedNumber = value.replace(new RegExp("[^+0-9]", "g"), "")
            if(sanitizedNumber.length === 10 && sanitizedNumber.startsWith("47")) {
                sanitizedNumber = "+" + sanitizedNumber
            }
            if (sanitizedNumber.startsWith("+47")) {
                // If there was found any weird symbols on a number starting with our country code, it's probably a mistake
                return new AsYouType().input(sanitizedNumber)
            } else {
                // If the number does not start with our country code, we have to believe that the user typed in the correct symbols
                return new AsYouType().input(value)
            }
        } else return value
    })
}


async function navigateToUsers(page: Page) {
    // Cant be static because the ID is from .env
    const theatreId = needEnvVariable(EnvironmentVariable.THEATRE_ID)
    const usersUrl = "https://www.schedgeup.com/theatres/" + theatreId + "/users"
    await navigateToUrl(page, usersUrl)
}
