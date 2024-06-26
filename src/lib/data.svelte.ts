export class Data {
    n: number = 0;
    actions: Action[] = $state([]);
    head: number = $state(0); // index of the last action
    players: Player[] = $state([]);
    pool: Array<Player> = $state([]);

    constructor() {}

    setPlayerPool(pool: Array<Player>) {
        this.pool = pool;
    }

    add(id: Id, delta: Points) {
        if (this.head < this.actions.length) {
            this.actions = this.actions.slice(0, this.head);
        }
        this.actions.push({ playerId: id, delta });
        this.head++;
    }

    addPlayer(id: number) {
        const player = this.pool.find((p) => p.id === id);
        if (player) {
            this.players.push(player);
        }
    }

    undo() {
        if (this.head > 0) {
            this.head--;
        }
    }

    redo() {
        if (this.head < this.actions.length) {
            this.head++;
        }
    }

    get summary(): Summary {
        const score: Record<Id, Points> = {};
        for (let i = 0; i < this.head; i++) {
            const { playerId, delta } = this.actions[i];
            score[playerId] = (score[playerId] ?? 0) + delta;
        }
        const summary = this.players
            .map((player) => {
                const points = score[player.id] ?? 0;
                return { player, score: points };
            })
            .sort((a, b) => {
                return b.score - a.score;
            });
        return summary;
    }

    get history(): Array<{ name: string; color: string; delta: number; score: number }> {
        const score: Record<Id, Points> = {};
        const history = [];
        for (let i = 0; i < this.head; i++) {
            const { playerId, delta } = this.actions[i];
            score[playerId] = (score[playerId] ?? 0) + delta;
            const player = this.players.find(({ id }) => id === playerId);
            history.push({
                name: player?.name ?? '???',
                color: player?.color ?? 'gray',
                delta,
                score: score[playerId],
            });
        }
        history.reverse();
        return history;
    }

    get canUndo() {
        return this.head > 0;
    }

    get canRedo() {
        return this.head < this.actions.length;
    }

    /**
     * Players that are not in the game yet
     */
    get freePlayers(): Player[] {
        return this.pool.filter((p) => !this.players.includes(p));
    }
}

type Id = number;
type Points = number;

type Action = {
    playerId: Id;
    delta: Points;
};

export type Player = {
    id: Id;
    name: string;
    color: string; // tailwindcss color or hex?
};

type Summary = Array<{
    player: Player;
    score: Points;
}>;
