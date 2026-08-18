import type { MagiportGRDataObject } from "./definitions/adventureland-server.js"
import { Pathfinder } from "./Pathfinder.js"
import { PingCompensatedCharacter } from "./PingCompensatedCharacter.js"

export class Mage extends PingCompensatedCharacter {
    ctype: "mage" = "mage" as const

    // NOTE: UNTESTED
    public async alchemy(): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [alchemy].")

        const response = this.getResponsePromise("alchemy")
        this.emitSkill({ name: "alchemy" })
        return response
    }

    public async blink(x: number, y: number): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [blink].")

        // Blink rounds to the nearest 10 on the server, so we're going to preemptively
        // round to the nearest 10 and check if we can blink to that spot to avoid
        // wasting MP.
        const roundedX = Math.round(x / 10) * 10
        const roundedY = Math.round(y / 10) * 10
        if (x !== roundedX || y !== roundedY) {
            console.log(`Blink position changed from ${x},${y} to ${roundedX},${roundedY}.`)
            x = roundedX
            y = roundedY
        }

        if (!Pathfinder.canStand({ map: this.map, x: x, y: y }))
            throw new Error(`We cannot blink to ${this.map},${x},${y}`)

        const response = this.getResponsePromise("blink")
        this.emitSkill({ name: "blink", x: x, y: y })
        return response
    }

    // NOTE: UNTESTED
    public async burst(target: string): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [burst].")

        const response = this.getResponsePromise("burst")
        this.emitSkill({ id: target, name: "burst" })
        return response
    }

    /**
     * Controlled burst allows mages to spend MP to attack each target that they specify
     * @param targets [[entityID, mpForTarget], ...]
     * @returns
     */
    public async cburst(targets: [string, number][]): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [cburst].")
        if (targets.length == 0) throw new Error("No targets were given to cburst.")

        const response = this.getResponsePromise("cburst")
        this.emitSkill({ name: "cburst", targets: targets })
        return response
    }

    public async energize(target: string, mp?: number): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [energize].")

        const response = this.getResponsePromise("energize")
        this.emitSkill({ id: target, mp: mp, name: "energize" })
        return response
    }

    // NOTE: UNTESTED
    public async entangle(target: string, essenceofnature = this.locateItem("essenceofnature")): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [entangle].")
        if (essenceofnature === undefined) throw new Error("We need an essenceofnature in order to entangle.")

        const response = this.getResponsePromise("entangle")
        this.emitSkill({
            id: target,
            name: "entangle",
            num: essenceofnature,
        })
        return response
    }

    public async light(): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [light].")

        const response = this.getResponsePromise("light")
        this.emitSkill({
            name: "light",
        })
        return response
    }

    /**
     * Sends an offer to teleport another player to your location
     *
     * NOTE: If you offer to magiport a player that is not online, it will still use MP.
     *
     * @param target The ID of the player to teleport
     * @returns A boolean representing whether or not the offer was sent
     */
    public async magiport(target: string): Promise<boolean> {
        if (!this.ready) throw new Error("We aren't ready yet [magiport].")

        let status: boolean
        const getMagiportStatus = (data: MagiportGRDataObject) => {
            if (typeof data !== "object") return
            if (data.response == "magiport_failed" && data.id == target) {
                status = false
                return
            }
            if (data.response == "magiport_sent" && data.id == target) {
                status = true
                return
            }
        }
        this.socket.on("game_response", getMagiportStatus)

        try {
            const response = this.getResponsePromise("magiport")
            this.emitSkill({ id: target, name: "magiport" })
            await response
        } finally {
            this.socket.off("game_response", getMagiportStatus)
        }

        return status
    }

    /**
     * NOTE: This function is not named 'reflection' due to the 'reflection' property.
     *
     * @param {string} target
     * @return {*}  {Promise<void>}
     * @memberof Mage
     */
    public async applyReflection(target: string): Promise<unknown> {
        if (!this.ready) throw new Error("We aren't ready yet [applyReflection].")

        const response = this.getResponsePromise("reflection")
        this.emitSkill({
            id: target,
            name: "reflection",
        })
        return response
    }
}
