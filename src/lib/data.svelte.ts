const STORAGE_KEY = 'datav1';

export class Data {
    actions: Action[] = $state([]);
    head: number = $state(0); // index of the last action
    players: Player[] = $state([]);
    pool: Array<Player> = $state([]);

    constructor() {
        // Load from localStorage on startup
        $effect.pre(() => {
            try {
                const data = window.localStorage.getItem(STORAGE_KEY);
                if (data) {
                    const { actions, head, players } = JSON.parse(data);
                    this.actions = actions;
                    this.head = head;
                    this.players = players;
                }
            } catch (ex) {
                console.error('Failed to load data from localStorage', ex);
            }
        });

        // Save to localStorage after each change
        $effect(() => {
            // NOTE: Not serializing the pool because there's no way to remove players from it yet
            const serialized = JSON.stringify({
                actions: this.actions,
                head: this.head,
                players: this.players,
            });
            window.localStorage.setItem(STORAGE_KEY, serialized);
        });
    }

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

    reset() {
        this.actions = [];
        this.head = 0;
        this.players = [];
    }

    get summary(): Summary {
        // Calculate score
        const score: Record<Id, Points> = {};
        for (let i = 0; i < this.head; i++) {
            const { playerId, delta } = this.actions[i];
            score[playerId] = (score[playerId] ?? 0) + delta;
        }
        // Ensure all players have a score
        for (const player of this.players) {
            if (!(player.id in score)) {
                score[player.id] = 0;
            }
        }
        // Compute the rank of each player
        const ranks: Record<Id, number> = {};
        const ranking: Array<{ id: number; points: number }> = Object.entries(score)
            .sort((a, b) => b[1] - a[1])
            .map(([id, points]) => ({ id: parseInt(id), points }));
        for (let i = 0; i < ranking.length; ) {
            const rank = i + 1;
            const rankPoints = ranking[i].points;
            while (i < ranking.length && ranking[i].points === rankPoints) {
                ranks[ranking[i].id] = rank;
                i++;
            }
        }
        // Generate the summary
        const summary = this.players.map((player) => {
            let showTurtle = false;
            if (this.players.length > 2 && ranks[player.id] === this.players.length) {
                const maxScore = ranking[0].points;
                const thisScore = ranking[ranking.length - 1].points;
                const nextScore = ranking[ranking.length - 2].points;
                if (maxScore > 0) {
                    const p = thisScore / maxScore;
                    const pNext = nextScore / maxScore;
                    if (p < 0.5 && pNext > 0.5 && pNext - p > 0.2) {
                        showTurtle = true;
                    }
                }
            }
            return {
                player,
                score: score[player.id],
                rank: ranks[player.id],
                showTurtle,
            };
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
        return this.pool.filter((p) => !this.players.find((p2) => p.id === p2.id));
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
    rank: number; // 1 for first, 2 for second, etc., in case of ties both players will have the same rank
    showTurtle: boolean;
}>;
