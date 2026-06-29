<script lang="ts">
    import { flip } from 'svelte/animate';
    import type { Data } from '$lib/data.svelte';

    const { data, firstPlayer }: { data: Data; firstPlayer: number | null } = $props();

    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

    const ranked = $derived([...data.summary].sort((a, b) => a.rank - b.rank));

    // TODO: won't firstPlayerId always be firstPlayer? why is this part of state not in Data?
    const firstPlayerId = $derived(
        firstPlayer != null ? (data.players[firstPlayer]?.id ?? null) : null,
    );

    // Track previous scores so we know when a pop animation should trigger
    let prevScores: Record<number, number> = {};
    // Animation plays whenever the value changes
    let popKeys: Record<number, number> = $state({});

    $effect(() => {
        for (const entry of data.summary) {
            const prev = prevScores[entry.player.id];
            if (prev !== undefined && prev !== entry.score) {
                popKeys[entry.player.id] = (popKeys[entry.player.id] ?? 0) + 1;
            }
            prevScores[entry.player.id] = entry.score;
        }
    });
</script>

<div class="flex flex-col gap-2 p-3">
    {#each ranked as entry (entry.player.id)}
        <div
            class="player-card"
            animate:flip={{ duration: 350 }}
            style="--player-color: {entry.player.color}"
        >
            <!-- Colored left border -->
            <div class="color-bar"></div>

            <!-- Rank -->
            <div class="rank-col">
                {#if entry.rank <= 3}
                    <span class="medal">{medals[entry.rank]}</span>
                {:else}
                    <span class="rank-num">#{entry.rank}</span>
                {/if}
            </div>

            <!-- Name -->
            <div class="name-col">
                <span class="player-name">{entry.player.name}</span>
                {#if entry.player.id === firstPlayerId}
                    <span class="first-star" title="Goes first">★</span>
                {/if}
            </div>

            <!-- Score: re-keyed so the pop animation fires on each change -->
            {#key popKeys[entry.player.id]}
                <div class="score-col" class:score-pop={popKeys[entry.player.id] != null}>
                    {entry.score}
                </div>
            {/key}
        </div>
    {/each}
</div>

<style lang="postcss">
    .player-card {
        @apply flex items-center gap-3 rounded-2xl bg-white shadow-sm;
        @apply relative overflow-hidden;
        padding: 0.6rem 1rem 0.6rem 0;
        min-height: 3.5rem;
    }

    .color-bar {
        width: 5px;
        align-self: stretch;
        border-radius: 2px;
        background-color: var(--player-color);
        flex-shrink: 0;
        margin-right: 0.25rem;
        margin-left: 0.5rem;
    }

    .rank-col {
        @apply w-8 flex-shrink-0 flex items-center justify-center;
    }

    .medal {
        font-size: 1.4rem;
        line-height: 1;
    }

    .rank-num {
        @apply text-sm font-bold text-gray-400;
    }

    .name-col {
        @apply flex-1 flex items-center gap-1 min-w-0;
    }

    .player-name {
        @apply text-lg font-semibold text-gray-800 truncate;
    }

    .first-star {
        @apply text-amber-400 text-sm leading-none flex-shrink-0;
    }

    .score-col {
        @apply text-3xl font-black text-gray-800 tabular-nums;
        min-width: 3rem;
        text-align: right;
    }

    @keyframes score-pop {
        0% {
            transform: scale(1);
        }
        40% {
            transform: scale(1.35);
        }
        100% {
            transform: scale(1);
        }
    }

    .score-pop {
        animation: score-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
</style>
