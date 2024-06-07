import {getSchedgeUpPage, navigateToUrl} from "../browser.js"
import {ScheduleEventInfo} from "./schedule.js"

const EVENT_ASSIGN_FORMAT = "https://www.schedgeup.com/events/%s/edit"

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
    subtitle: string | undefined
    workers: Worker[]
    showTemplateId: string | undefined
    eventCallTime: Date
    eventStartTime: Date
    eventEndTime: Date

    constructor(id: string, title: string, subtitle: string | undefined, workers: Worker[], showTemplateId: string | undefined, eventCallTime: Date, eventStartTime: Date, eventEndTime: Date) {
        this.id = id
        this.title = title
        this.subtitle = subtitle
        this.workers = workers
        this.showTemplateId = showTemplateId
        this.eventCallTime = eventCallTime
        this.eventStartTime = eventStartTime
        this.eventEndTime = eventEndTime
    }
}

export async function scrapeEvents(eventInfos: ScheduleEventInfo[]) {
    const pageAndReleaser = await getSchedgeUpPage()
    const page = pageAndReleaser.page
    const events: Event[] = []
    for (let i = 0; i < eventInfos.length; i++) {
        const id = eventInfos[i].id
        const usersSelector = ".assignedUsers"
        console.log("Extracting users from " + id)
        await navigateToUrl(page, EVENT_ASSIGN_FORMAT.replace("%s", id))

        // Fetch the workers currently assigned to this show
        const workers = JSON.parse(await page.$$eval(usersSelector, (events) => {

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
                            // Regex is to remove the appended (0)/(1) etc.. (The required amount of users in SU)
                            const roleTrimmed = role.innerText.replace(new RegExp("\\(\\d+\\)"), "").trim()
                            workers.push(new Worker(id, roleTrimmed, name == null ? "MissingName" : name.trim()))
                        } else {
                            // Guests
                            const who = whoListElement.querySelector(".assignmentFields")
                            if (who === null) throw new Error("Error trying to read user assignment entry")
                            const whoTextElement = who.querySelector("[type=\"text\"]")
                            if (whoTextElement === null) throw new Error("Could not find text element in Guest entry")
                            const whoText = whoTextElement.getAttribute("value")
                            if (whoText === null) throw new Error("Could not find text content in text element in Guest entry")

                            workers.push(new Worker(id, role.innerText.split(" ")[0], whoText))
                        }
                    })
                }
            })

            return JSON.stringify(workers)
        }))

        class MoreEventInfo {
            title: string
            subtitle: string | undefined
            eventStartTime: Date
            eventEndTime: Date

            constructor(title: string, subtitle: string | null | undefined, eventStartTime: Date, eventEndTime: Date) {
                this.title = title
                if (subtitle === null) {
                    this.subtitle = undefined
                }  else {
                    this.subtitle = subtitle
                }
                this.eventStartTime = eventStartTime
                this.eventEndTime = eventEndTime
            }
        }

        const moreInfo: MoreEventInfo = JSON.parse(await page.$eval(".form-container > .infoForm > .fields", (element, eventDate) => {
            const fields = element.children

            const title = fields.item(1)?.children.item(1)?.getAttribute("value")

            const subtitle = fields.item(2)?.children.item(1)?.getAttribute("value")

            const showStartTime = fields.item(6)?.firstElementChild?.textContent?.split(new RegExp("[(|)]"))[1].split(":")

            const showEndTime = fields.item(8)?.firstElementChild?.textContent?.replaceAll("\n", "")?.split(new RegExp("[(|)]"))[1].split(":")

            if (!title || !showStartTime || !showEndTime) {
                for (let j = 0; j < fields.length; j++) {
                    console.info(fields[j].firstElementChild?.textContent)
                }
                console.info("" + title + subtitle + showStartTime + "|" + showEndTime)
                throw new Error("Error fetching title or show times from " + (title === null ? "some event" : title))
            }

            const fromHours = Number(showStartTime[0])
            const fromMinutes = Number(showStartTime[1])
            const toHours = Number(showEndTime[0])
            const toMinutes = Number(showEndTime[1])

            // TODO WE ALSO HAVE CALL TIME HERE
            // TODO Maybe drop the ajax magic then?

            const eventDateParsed = new Date(eventDate) // TODO look for date on page? So id is the only thing needed for fetch
            const eventStartTime = new Date(eventDateParsed.getFullYear(), eventDateParsed.getMonth(), eventDateParsed.getDate(), fromHours, fromMinutes)
            const eventEndTime = new Date(eventDateParsed.getFullYear(), eventDateParsed.getMonth(), eventDateParsed.getDate(), toHours, toMinutes)

            return JSON.stringify({
                title: title,
                subtitle: subtitle,
                eventStartTime: eventStartTime,
                eventEndTime: eventEndTime,
            })
        }, eventInfos[i].eventStartTime), (key, value) => {
            if (key === "eventStartTime" || key === "eventEndTime") {
                return new Date(value)
            } else return value
        })


        events.push(new Event(id, moreInfo.title, moreInfo.subtitle, workers, eventInfos[i].showtemplateId, eventInfos[i].eventCallTime, moreInfo.eventStartTime, moreInfo.eventEndTime))
    }

    pageAndReleaser.release()
    return events
}
