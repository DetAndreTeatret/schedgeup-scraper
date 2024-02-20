import {getSchedgeUpPage, navigateToUrl} from "../browser.js"
import {EventIdAndDate} from "./schedule.js"

const EVENT_ASSIGN_FORMAT = "https://www.schedgeup.com/assignments/%s/edit"

export class Worker {
    id: string | null // null if Guest
    role: string
    who: string

    constructor(id: string | null, role: string, who: string) {
        this.id = id
        this.role = role
        this.who = who
    }
}

export class Event {
    id: string
    title: string
    workers: Worker[]
    showTemplateId: string | undefined
    date: Date

    constructor(id: string, title: string, workers: Worker[], showTemplateId: string | undefined, date: Date) {
        this.id = id
        this.title = title
        this.workers = workers
        this.showTemplateId = showTemplateId
        this.date = date
    }
}

export async function scrapeEvents(eventInfos: EventIdAndDate[]) {
    const page = getSchedgeUpPage()
    const events: Event[] = []
    for (let i = 0; i < eventInfos.length; i++) {
        const id = eventInfos[i].id
        const usersSelector = ".assignedUsers"
        console.log("Extracting users from " + id)
        await navigateToUrl(page, EVENT_ASSIGN_FORMAT.replace("%s", id))

        // Fetch the workers currently assigned to this show
        const workers = await page.$$eval(usersSelector, (events) => {

            // Duplicate since browser can not see our class
            class Worker {
                id: string | null // null if Guest
                role: string
                who: string

                constructor(id: string | null, role: string, who: string) {
                    this.id = id
                    this.role = role
                    this.who = who
                }
            }

            const workers: Worker[] = []

            events.forEach((element) => {
                const role = element.getElementsByTagName("LABEL")[0] as HTMLElement
                const whoList = element.querySelectorAll(".userBar")

                if (role != null && whoList.length > 0) {
                    whoList.forEach(whoListElement => {
                        const id = whoListElement.getAttribute("data-id")
                        const who = whoListElement.querySelector(".bar_info") as HTMLElement
                        if (who != null) {
                            const name = who.firstChild?.textContent?.replaceAll("\n", "")
                            workers.push(new Worker(id, role.innerText.split(" ")[0], name == null ? "MissingName" : name.trim()))
                        } else {
                            // Guests
                            const who = whoListElement.querySelector(".assignmentFields")
                            if (who === null) throw new Error("Error trying to read user assignment entry")
                            const whoTextElement = who.querySelector("[type=\"text\"]")
                            if(whoTextElement === null) throw new Error("Could not find text element in Guest entry")
                            const whoText = whoTextElement.getAttribute("value")
                            if(whoText === null) throw new Error("Could not find text content in text element in Guest entry")

                            workers.push(new Worker(id, role.innerText.split(" ")[0], whoText))
                        }
                    })
                }
            })

            return JSON.stringify(workers)
        })

        // Fetch the name of this show
        const title: string = await page.$eval("#header", event => {
            // Include spaces in split so there is no space at the end of title text
            const subtitle = event.querySelector(".subtitle") as HTMLElement
            return subtitle == null ? "null" : subtitle.innerText.split(" • ")[0]
        })

        events.push(new Event(id, title, JSON.parse(workers), eventInfos[i].showtemplateId, eventInfos[i].date))
    }

    return events
}
