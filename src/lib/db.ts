import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Player } from '$lib/data.svelte';

const DB_NAME = 'khipu';
const DB_VERSION = 1;
const STORE = 'players';

interface KhipuDB extends DBSchema {
    players: {
        key: number;
        value: Player;
    };
}

let dbPromise: Promise<IDBPDatabase<KhipuDB>> | null = null;

function getDB(): Promise<IDBPDatabase<KhipuDB>> {
    if (typeof window === 'undefined') {
        throw new Error('IndexedDB is only available in the browser');
    }
    if (!dbPromise) {
        dbPromise = openDB<KhipuDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
            },
        });
    }
    return dbPromise;
}

export async function getAllPlayers(): Promise<Player[]> {
    const db = await getDB();
    return db.getAll(STORE);
}

/** Insert a new player, letting IndexedDB assign the auto-incremented id. */
export async function createPlayer(name: string, color: string): Promise<Player> {
    const db = await getDB();
    // id is omitted so the autoIncrement keyPath assigns one.
    const id = (await db.add(STORE, { name, color } as unknown as Player)) as number;
    return { id, name, color };
}

export async function updatePlayer(player: Player): Promise<void> {
    const db = await getDB();
    await db.put(STORE, player);
}

export async function deletePlayer(id: number): Promise<void> {
    const db = await getDB();
    await db.delete(STORE, id);
}
