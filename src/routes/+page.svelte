<script lang="ts">
    import { setContext } from 'svelte';

    import { Data } from '$lib/data.svelte';
    import Scoredial from '$lib/ui/Scoredial.svelte';
    import Scoreboard from '$lib/ui/Scoreboard.svelte';
    import History from '$lib/ui/History.svelte';
    import { parsePlayerPool } from '$lib/common';

    const data = new Data();

    let showHistory = $state(false);

    $effect(() => {
        const players = parsePlayerPool(window.location.hash);
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

        window.addEventListener("beforeunload", (ev) => {
            if (data.actions.length > 0) {
                ev.preventDefault();
            }
        });
    });

    setContext('data', data);

    function selection(node: HTMLSelectElement) {
        const selectPlayer = (ev: Event) => {
            const id = parseInt(ev.target.value);
            if (id) {
                data.addPlayer(id);
            }
            ev.target.value = '';
        };

        node.addEventListener('change', selectPlayer);
        return {
            destroy() {
                node.removeEventListener('change', selectPlayer);
            },
        };
    }
</script>

<!-- Outer container -->
<div class="flex flex-col w-full h-full select-none">
    <!-- Toolbar -->
    <div class="flex flex-row justify-between items-center mx-2">
        <h1 class="text-2xl font-bold px-1 text-slate-800">
            {showHistory ? 'History' : 'Scoreboard'}
        </h1>
        <div>
            <button onclick={() => data.undo()} disabled={!data.canUndo}>Undo</button>
            <button onclick={() => data.redo()} disabled={!data.canRedo}>Redo</button>
            <select use:selection>
                <option value="">Select</option>
                {#each data.freePlayers as p}
                    <option value={p.id}>{p.name}</option>
                {/each}
            </select>
            <button onclick={() => (showHistory = !showHistory)}>
                {showHistory ? 'Ranking' : 'History'}
            </button>
        </div>
    </div>

    <!-- Main content -->
    <div class="main flex-grow overflow-hidden">
        <!-- Scoreboard -->
        <div class="bg-gray-200 overflow-scroll">
            {#if showHistory}
                <History {data} />
            {:else}
                <Scoreboard {data} />
            {/if}
        </div>

        <!-- Dial -->
        <div class="bg-gray-900 flex justify-center items-center overflow-hidden">
            <Scoredial players={data.players} onpress={(id, delta) => data.add(id, delta)} />
        </div>
    </div>
</div>

<style>
    button,
    select {
        @apply px-2 mx-2 py-1 my-1;
        @apply bg-blue-500 text-white rounded-md;
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
