import { jest } from "@jest/globals"
import { Character } from "./Character"
import { Game } from "./Game"
import { Pathfinder } from "./Pathfinder"
import type { ServerData } from "./definitions/adventureland-server"

const serverData: ServerData = { region: "US", name: "I", address: "test", path: "/test", players: 0, key: "USI" }

beforeAll(async () => {
    await Game.getGData(true, false)
    await Pathfinder.prepare(Game.G)
})

afterEach(() => {
    jest.restoreAllMocks()
})

function characterUnderTest(targets: number): Character {
    const character = new Character("", "", "smartMoveTest", Game.G, serverData)
    character.ready = true
    character.rip = false
    character.c = {}
    character.map = "main"
    character.x = 0
    character.y = 0
    character.speed = 100
    character.targets = targets
    character.entities = new Map()
    return character
}

test("smartMove walks through a town path instead of teleporting while attacked", async () => {
    const character = characterUnderTest(1)
    const path = [
        { map: "main" as const, type: "move" as const, x: 0, y: 0 },
        { map: "main" as const, type: "town" as const, x: 10, y: 10 },
        { map: "main" as const, type: "move" as const, x: 100, y: 100 },
    ]
    const moves: { x: number; y: number }[] = []
    const warpToTown = jest.spyOn(character, "warpToTown").mockRejectedValue(new Error("teleport should not be used"))
    jest.spyOn(character, "move").mockImplementation(async (x, y) => {
        moves.push({ x, y })
        character.x = x
        character.y = y
        return { map: character.map, x, y }
    })
    jest.spyOn(character, "canUse").mockReturnValue(true)
    const blink = jest.fn(async () => undefined)
    ;(character as unknown as { blink: typeof blink }).blink = blink
    jest.spyOn(Pathfinder, "getPath").mockReturnValue(path)
    jest.spyOn(Pathfinder, "canWalkPath").mockReturnValue(false)

    await character.smartMove({ map: "main", x: 100, y: 100 }, { useBlink: true })

    expect(warpToTown).not.toHaveBeenCalled()
    expect(blink).not.toHaveBeenCalled()
    expect(moves).toEqual([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 100, y: 100 },
    ])
})

test("smartMove stops scheduling town warps after a teleport is interrupted by an attack", async () => {
    const character = characterUnderTest(0)
    const path = [
        { map: "main" as const, type: "move" as const, x: 0, y: 0 },
        { map: "main" as const, type: "town" as const, x: 10, y: 10 },
        { map: "main" as const, type: "move" as const, x: 100, y: 100 },
    ]
    const moves: { x: number; y: number }[] = []
    const warpToTown = jest.spyOn(character, "warpToTown").mockImplementation(async () => {
        character.targets = 1
        throw new Error("warpToTown interrupted by attack")
    })
    jest.spyOn(character, "move").mockImplementation(async (x, y) => {
        moves.push({ x, y })
        character.x = x
        character.y = y
        return { map: character.map, x, y }
    })
    jest.spyOn(Pathfinder, "getPath").mockReturnValue(path)
    jest.spyOn(Pathfinder, "canWalkPath").mockReturnValue(false)

    const options = {}
    await character.smartMove({ map: "main", x: 100, y: 100 }, options)

    expect(warpToTown).toHaveBeenCalledTimes(1)
    expect(moves).toEqual([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 100, y: 100 },
    ])
    expect(options).toMatchObject({ avoidTownWarps: true })
})
