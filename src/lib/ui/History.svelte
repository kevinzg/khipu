<script lang="ts">
    import { formatDelta } from '$lib/common';
    import type { Data } from '$lib/data.svelte';

    const { data }: { data: Data } = $props();
</script>

<div class="flex flex-col gap-2 p-3 text-gray-900">
    {#each data.history as h, idx (idx)}
        <div class="history-card" style="--player-color: {h.color}">
            <div class="color-dot" style="background-color: {h.color}"></div>
            <span class="name">{h.name}</span>
            <span class="delta" class:positive={h.delta > 0} class:negative={h.delta < 0}>
                {formatDelta(h.delta)}
            </span>
            <span class="total">{h.score}</span>
        </div>
    {/each}
</div>

<style lang="postcss">
    .history-card {
        @apply flex items-center gap-3 rounded-2xl bg-white shadow-sm px-4 py-3;
    }

    .color-dot {
        @apply w-3 h-3 rounded-full flex-shrink-0;
    }

    .name {
        @apply flex-1 text-base font-semibold text-gray-700 truncate;
    }

    .delta {
        @apply text-xl font-bold w-14 text-right tabular-nums;
    }

    .delta.positive {
        @apply text-emerald-600;
    }

    .delta.negative {
        @apply text-red-500;
    }

    .total {
        @apply text-xl font-black text-gray-800 w-12 text-right tabular-nums;
    }
</style>
