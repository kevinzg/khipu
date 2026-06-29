<script lang="ts">
    import { formatDelta } from '$lib/common';
    import type { Data } from '$lib/data.svelte';

    const { data }: { data: Data } = $props();

    let now = $state(Date.now());
    $effect(() => {
        const id = setInterval(() => (now = Date.now()), 30_000);
        return () => clearInterval(id);
    });

    function relativeTime(ts: number | undefined, reference: number): string {
        if (ts == null) return '';
        const diff = Math.max(0, reference - ts);
        const min = Math.floor(diff / 60_000);
        if (min < 1) return 'just now';
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        return `${Math.floor(hr / 24)}d ago`;
    }
</script>

<div class="flex flex-col gap-2 p-3 text-gray-900">
    {#each data.history as h, idx (idx)}
        <div class="history-card" style="--player-color: {h.color}">
            <div class="color-dot" style="background-color: {h.color}"></div>
            <div class="info">
                <span class="name">{h.name}</span>
                <span class="time">{relativeTime(h.timestamp, now)}</span>
            </div>
            <span class="delta" class:positive={h.delta > 0} class:negative={h.delta < 0}>
                {formatDelta(h.delta)}
            </span>
            <span class="total">{h.score}</span>
        </div>
    {/each}
</div>

<style lang="postcss">
    .history-card {
        @apply flex items-center gap-3 rounded-2xl bg-white shadow-sm px-4 py-2;
    }

    .color-dot {
        @apply w-3 h-3 rounded-full flex-shrink-0;
    }

    .info {
        @apply flex-1 flex flex-col min-w-0;
    }

    .name {
        @apply text-base font-semibold text-gray-700 truncate;
    }

    .time {
        @apply text-xs text-gray-400 font-normal leading-tight;
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
