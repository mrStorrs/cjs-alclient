import type {
    ChannelInfo,
    ClientToServerSkillData,
    MiningResult,
    MiningStartGRDataObject,
    MiningStateData,
    MiningTerminalGRDataObject,
    ServerToClientEvents,
    StartData,
    UIData,
} from "./adventureland-server"

/**
 * The following is from socket events received 2021-04-22 to 2021-07-14
 * It is used to confirm type correctness
 */

test("UIData type validation", async () => {
    const buy: UIData = {
        type: "+$",
        id: "scrolls",
        name: "earthPri",
        item: {
            name: "mpot1",
            q: 1,
        },
    }
    expect(buy).toBeDefined()

    const mluck: UIData = {
        type: "mluck",
        from: "earthMer",
        to: "earthMer",
    }
    expect(mluck).toBeDefined()

    const trade_sell: UIData = {
        type: "+$$",
        seller: "earthWar",
        buyer: "Dinger",
        item: {
            name: "wbook0",
            level: 0,
            q: 1,
            price: 50000,
        },
        slot: "trade1",
        num: 23,
        snum: 6,
    }
    expect(trade_sell).toBeDefined()
})

test("Mining socket and public result type validation", () => {
    const channel: NonNullable<ChannelInfo["mining"]> = { ms: 2500, len: 5000, rock_id: "gold-2" }
    const state: MiningStateData = { rocks: { "gold-2": 1_787_123_456_789 } }
    const terminal: MiningTerminalGRDataObject = {
        response: "data",
        place: "mining",
        cevent: true,
        outcome: "success",
        rock_id: "gold-2",
        ore: "goldore",
        xp: 175,
        bonus: "gem0",
        bonus_omitted: true,
        available_at: 1_787_123_456_789,
    }
    const result: MiningResult = {
        outcome: "success",
        rockId: "gold-2",
        ore: "goldore",
        xp: 175,
        bonus: "gem0",
        availableAt: 1_787_123_456_789,
    }
    const omitted: ClientToServerSkillData = { name: "mining" }
    const explicit: ClientToServerSkillData = { name: "mining", id: "gold-2" }
    const startSnapshot: Pick<StartData, "mining_state"> = { mining_state: state }
    const started: MiningStartGRDataObject = {
        response: "data",
        place: "mining",
        success: false,
        in_progress: true,
        rock_id: "gold-2",
        duration: 5000,
    }
    const alreadyMining: MiningStartGRDataObject = {
        response: "in_progress",
        place: "mining",
        failed: true,
    }
    const events: Pick<ServerToClientEvents, "mining_state"> = {
        mining_state: (data) => expect(data).toEqual(state),
    }

    expect(channel.rock_id).toBe("gold-2")
    expect(terminal.rock_id).toBe(result.rockId)
    expect(omitted).toEqual({ name: "mining" })
    expect(explicit).toEqual({ name: "mining", id: "gold-2" })
    expect(startSnapshot.mining_state).toBe(state)
    expect(started.rock_id).toBe("gold-2")
    expect(alreadyMining.response).toBe("in_progress")
    events.mining_state(state)
})
