import type { Player } from '$lib/data.svelte';
import * as db from '$lib/db';

const DEFAULT_PLAYERS: Array<{ name: string; color: string }> = [
    { name: 'Alice', color: '#2563eb' },
    { name: 'Bob', color: '#dc2626' },
    { name: 'Charlie', color: '#22c55e' },
    { name: 'David', color: '#eab308' },
    { name: 'Eve', color: '#c026d3' },
];

/**
 * Reactive, IndexedDB-backed roster of selectable players.
 */
export class Roster {
    players: Player[] = $state([]);

    /**
     * Load the roster from IndexedDB, seeding the default players on first run
     * (empty store). Browser-only.
     */
    async load() {
        let players = await db.getAllPlayers();

        if (players.length === 0) {
            players = [];
            for (const { name, color } of DEFAULT_PLAYERS) {
                players.push(await db.createPlayer(name, color));
            }
        }

        this.players = players;
    }

    async add(name: string, color: string): Promise<Player> {
        const player = await db.createPlayer(name, color);
        this.players.push(player);
        return player;
    }

    async update(player: Player) {
        await db.updatePlayer($state.snapshot(player));
        const i = this.players.findIndex((p) => p.id === player.id);
        if (i !== -1) this.players[i] = player;
    }

    async remove(id: number) {
        await db.deletePlayer(id);
        this.players = this.players.filter((p) => p.id !== id);
    }
}
