<script lang="ts">
    import { setContext } from 'svelte';

    import { loop, longpress, assert } from '$lib/common';
    import { Data } from '$lib/data.svelte';
    import Scoredial from '$lib/ui/Scoredial.svelte';
    import Scoreboard from '$lib/ui/Scoreboard.svelte';
    import History from '$lib/ui/History.svelte';
    import { parsePlayerPool } from '$lib/common';
    import Lines from '$lib/ui/Lines.svelte';

    const data = new Data();

    let showHistory = $state(false);

    $effect(() => {
        const players = parsePlayerPool(
            window.localStorage.getItem('khipu:playersv1') ?? window.location.hash,
        );
        if (players.length > 0) {
            data.setPlayerPool(players);
        } else {
            data.setPlayerPool([
                { id: 1, name: 'Alice', color: '#2563eb' },
                { id: 2, name: 'Bob', color: '#dc2626' },
                { id: 3, name: 'Charlie', color: '#22c55e' },
                { id: 4, name: 'David', color: '#eab308' },
                { id: 5, name: 'Eve', color: '#c026d3' },
            ]);
        }

        window.addEventListener('beforeunload', (ev) => {
            if (data.actions.length > 0) {
                ev.preventDefault();
            }
        });
    });

    setContext('data', data);

    function selection(node: HTMLSelectElement) {
        const selectPlayer = () => {
            const id = parseInt(node.value);
            if (id) {
                data.addPlayer(id);
            }
            node.value = '';
        };
        node.addEventListener('change', selectPlayer);
        return {
            destroy() {
                node.removeEventListener('change', selectPlayer);
            },
        };
    }

    function reset() {
        if (!ongoingPick && confirm('Are you sure you want to start a new game?')) {
            data.reset();
            firstPlayer = null;
        }
    }

    let firstPlayer: null | number = $state(null);
    let ongoingPick = $state(false);

    function pickFirstPlayer() {
        if (ongoingPick || data.players.length < 2) return;
        const n = data.players.length;
        ongoingPick = true;
        firstPlayer = Math.floor(Math.random() * n);
        const duration = 2000 + Math.random() * 1000;
        const easeOutCustom = (x: number) => 1 - (1 - x) * (1 - x);
        let prev = -1;
        const nSteps = 4 * n + Math.floor(Math.random() * n);
        let mode = Math.floor(Math.random() * 2);
        loop(
            duration,
            (elapsedTime) => {
                const progress = elapsedTime / duration;
                const step = Math.floor(easeOutCustom(progress) * nSteps);
                if (step !== prev) {
                    assert(firstPlayer !== null, 'firstPlayer is null');
                    if (mode === 0) {
                        firstPlayer = (firstPlayer + 1) % n;
                    } else {
                        // Don't pick the same player twice in a row
                        const x = Math.floor(Math.random() * (n - 1));
                        firstPlayer = x >= firstPlayer ? x + 1 : x;
                    }
                    prev = step;
                }
            },
            () => {
                ongoingPick = false;
            },
        );
    }

    function setPlayers() {
        const players = prompt('Players `#P1,ff0000;P2,00ff00`');
        if (players) window.localStorage.setItem('khipu:playersv1', players);
    }
</script>

<!-- Outer container -->
<div class="flex flex-col w-full h-full select-none">
    <!-- Main content -->
    <div class="main flex-grow overflow-hidden">
        <!-- Scoreboard panel -->
        <div class="flex flex-col bg-gray-50 overflow-scroll">
            <!-- Toolbar -->
            <div
                class="flex flex-row justify-between items-center px-2 py-2 space-x-2 bg-white border-b border-gray-100 shadow-sm"
            >
                <div class="flex flex-row space-x-2">
                    <button
                        class="button icon"
                        title="Undo"
                        onclick={() => data.undo()}
                        disabled={!data.canUndo}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                            />
                        </svg>
                    </button>
                    <button
                        class="button icon"
                        title="Redo"
                        onclick={() => data.redo()}
                        disabled={!data.canRedo}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"
                            />
                        </svg>
                    </button>
                </div>
                <div>
                    <select use:selection class="text">
                        <option value="">Players</option>
                        {#each data.freePlayers as p (p.id)}
                            <option value={p.id}>{p.name}</option>
                        {/each}
                    </select>
                </div>
                <div class="flex flex-row space-x-2">
                    <button
                        title="Pick first player"
                        class="button icon"
                        class:yellow={ongoingPick}
                        use:longpress={1000}
                        onlongpress={setPlayers}
                        onclick={pickFirstPlayer}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
                            />
                        </svg>
                    </button>
                    <button
                        class="button icon"
                        title={showHistory ? 'Show scoreboard' : 'Show history'}
                        onclick={() => (showHistory = !showHistory)}
                    >
                        {#if showHistory}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 1 1 1.591 1.59l-1.83 1.83h2.16M2.99 15.745h1.125a1.125 1.125 0 0 1 0 2.25H3.74m0-.002h.375a1.125 1.125 0 0 1 0 2.25H2.99"
                                />
                            </svg>
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="size-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                                />
                            </svg>
                        {/if}
                    </button>
                    <button title="Reset" class="button red icon" onclick={reset}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {#if showHistory}
                <History {data} />
            {:else}
                <div class="flex flex-col flex-grow space-between">
                    <div class="flex-grow">
                        <Scoreboard {data} {firstPlayer} {ongoingPick} />
                    </div>
                    <Lines {data} />
                </div>
            {/if}
        </div>

        <!-- Dial -->
        <div class="bg-gray-900 flex justify-center items-center overflow-hidden">
            <Scoredial players={data.players} onpress={(id, delta) => data.add(id, delta)} />
        </div>
    </div>
</div>

<style lang="postcss">
    @reference 'tailwindcss';

    .button.icon {
        @apply w-11 flex items-center justify-center;
        @apply transition-transform active:scale-90;
    }

    select.text {
        @apply px-3 text-sm;
    }

    .button,
    select {
        @apply text-slate-600 h-11 p-2;
        @apply bg-slate-100 rounded-xl hover:bg-slate-200 active:bg-slate-300;
        @apply disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed;
    }

    .red {
        @apply text-red-500 bg-red-50 hover:bg-red-100 active:bg-red-200;
    }

    .yellow {
        @apply text-amber-500 bg-amber-50 hover:bg-amber-100 active:bg-amber-200;
    }

    .main {
        display: grid;
    }

    @media (min-aspect-ratio: 1/1) {
        .main {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr;
        }
    }

    @media (max-aspect-ratio: 1/1) {
        .main {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
        }
    }
</style>
