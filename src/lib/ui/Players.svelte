<script lang="ts">
    import type { Data, Player } from '$lib/data.svelte';
    import type { Roster } from '$lib/roster.svelte';
    import { PALETTE, nextColor } from '$lib/colors';

    const { data, roster, onclose }: { data: Data; roster: Roster; onclose: () => void } = $props();

    // Which player's color swatch popover is open (null = none).
    let editingColorId: number | null = $state(null);

    const usedColors = $derived(roster.players.map((p) => p.color));

    // New-player form state. newColor defaults to a free palette color but can
    // be overridden by tapping a swatch (writable $derived).
    let newName = $state('');
    let newColor = $derived(nextColor(usedColors));

    function inGame(id: number): boolean {
        return data.players.some((p) => p.id === id);
    }

    function toggleGame(player: Player) {
        if (inGame(player.id)) {
            data.removePlayer(player.id);
        } else {
            data.addPlayer(player.id);
        }
    }

    function pickColor(player: Player, color: string) {
        player.color = color;
        roster.update(player);
        editingColorId = null;
    }

    function commitName(player: Player) {
        const name = player.name.trim();
        if (name) {
            player.name = name;
            roster.update(player);
        }
    }

    function removePlayer(player: Player) {
        const hasScore = data.actions.some((a) => a.playerId === player.id);
        if (hasScore && !confirm(`${player.name} has scored points. Remove anyway?`)) {
            return;
        }
        data.removePlayer(player.id);
        roster.remove(player.id);
    }

    function addPlayer(ev: SubmitEvent) {
        ev.preventDefault();
        const name = newName.trim();
        if (!name) return;
        roster.add(name, newColor);
        newName = '';
    }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Players">
    <div class="panel">
        <!-- Header -->
        <div class="header">
            <h1 class="title">Players</h1>
            <button class="button icon" title="Close" onclick={onclose} aria-label="Close">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Roster list -->
        <div class="list">
            {#each roster.players as player (player.id)}
                <div class="row" class:active={inGame(player.id)}>
                    <!-- Color swatch + palette popover -->
                    <div class="swatch-wrap">
                        <button
                            class="swatch"
                            style="background-color: {player.color};"
                            title="Change color"
                            aria-label="Change color"
                            onclick={() =>
                                (editingColorId = editingColorId === player.id ? null : player.id)}
                        ></button>
                        {#if editingColorId === player.id}
                            <div class="palette">
                                {#each PALETTE as color (color)}
                                    <button
                                        class="palette-swatch"
                                        class:selected={player.color === color}
                                        class:taken={usedColors.includes(color) &&
                                            player.color !== color}
                                        style="background-color: {color};"
                                        title={color}
                                        aria-label={color}
                                        onclick={() => pickColor(player, color)}
                                    ></button>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- Name -->
                    <input
                        class="name"
                        bind:value={player.name}
                        onblur={() => commitName(player)}
                        onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />

                    <!-- In-game toggle -->
                    <button
                        class="button toggle"
                        class:on={inGame(player.id)}
                        title={inGame(player.id) ? 'Remove from game' : 'Add to game'}
                        aria-pressed={inGame(player.id)}
                        onclick={() => toggleGame(player)}
                    >
                        {#if inGame(player.id)}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                                stroke="currentColor"
                                class="size-5"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m4.5 12.75 6 6 9-13.5"
                                />
                            </svg>
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                                stroke="currentColor"
                                class="size-5"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                        {/if}
                    </button>

                    <!-- Delete -->
                    <button
                        class="button red icon"
                        title="Delete player"
                        aria-label="Delete player"
                        onclick={() => removePlayer(player)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-5"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>

        <!-- Add new player -->
        <form class="add" onsubmit={addPlayer}>
            <div class="add-row">
                <span class="swatch" style="background-color: {newColor};"></span>
                <input class="name" placeholder="New player name" bind:value={newName} />
                <button type="submit" class="button add-btn" disabled={!newName.trim()}>Add</button>
            </div>
            <div class="palette add-palette">
                {#each PALETTE as color (color)}
                    <button
                        type="button"
                        class="palette-swatch"
                        class:selected={newColor === color}
                        class:taken={usedColors.includes(color)}
                        style="background-color: {color};"
                        title={color}
                        aria-label={color}
                        onclick={() => (newColor = color)}
                    ></button>
                {/each}
            </div>
        </form>
    </div>
</div>

<style lang="postcss">
    @reference 'tailwindcss';

    .overlay {
        @apply fixed inset-0 z-50 flex;
    }

    .panel {
        @apply flex flex-col w-full h-full bg-gray-50 overflow-hidden;
    }

    .header {
        @apply flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm;
    }

    .title {
        @apply text-lg font-bold text-gray-800;
    }

    .list {
        @apply flex-grow overflow-y-auto p-3 space-y-2;
    }

    .row {
        @apply flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm;
    }

    .row.active {
        @apply ring-2 ring-blue-200;
    }

    .swatch-wrap {
        @apply relative flex-shrink-0;
    }

    .swatch {
        @apply block w-8 h-8 rounded-full border border-black/10;
    }

    .palette {
        @apply grid grid-cols-6 gap-1.5 p-2 rounded-xl bg-white shadow-lg border border-gray-100;
    }

    .swatch-wrap .palette {
        @apply absolute left-0 top-10 z-10 w-48;
    }

    .palette-swatch {
        @apply w-6 h-6 rounded-full border border-black/10 transition-transform active:scale-90;
    }

    .palette-swatch.selected {
        @apply ring-2 ring-offset-1 ring-gray-700;
    }

    .palette-swatch.taken {
        @apply opacity-40;
    }

    .name {
        @apply flex-1 min-w-0 px-2 py-1.5 text-base text-gray-800 bg-transparent rounded-lg;
        @apply focus:bg-gray-100 focus:outline-none;
    }

    .button {
        @apply text-slate-600 h-9 p-2 flex items-center justify-center;
        @apply bg-slate-100 rounded-xl hover:bg-slate-200 active:bg-slate-300;
        @apply disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed;
        @apply transition-transform active:scale-90;
    }

    .button.icon {
        @apply w-9 flex-shrink-0;
    }

    .toggle {
        @apply w-9 flex-shrink-0;
    }

    .toggle.on {
        @apply text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800;
    }

    .red {
        @apply text-red-500 bg-red-50 hover:bg-red-100 active:bg-red-200;
    }

    .add {
        @apply bg-white border-t border-gray-100 p-3 space-y-2;
    }

    .add-row {
        @apply flex items-center gap-2;
    }

    .add .swatch {
        @apply flex-shrink-0;
    }

    .add-btn {
        @apply px-4 font-semibold flex-shrink-0;
    }

    .add-palette {
        @apply grid-cols-12;
    }
</style>
