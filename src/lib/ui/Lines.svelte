<script lang="ts">
    import type { Data } from '$lib/data.svelte';

    const { data }: { data: Data } = $props();

    const bars = $derived.by(() => {
        const max = Math.max(1, ...data.summary.map((p) => p.score));
        return data.summary
            .slice()
            .sort((a, b) => a.score - b.score)
            .map((p) => ({
                color: p.player.color,
                pct: Math.max(0, (p.score / max) * 100),
                score: p.score,
                name: p.player.name,
            }));
    });
</script>

{#if bars.length > 0}
    <div class="bars-container px-3 pb-3 pt-1 flex flex-col gap-1">
        {#each bars as b (b.name)}
            <div class="bar-row">
                <div class="bar-fill" style="width: {b.pct}%; background-color: {b.color};"></div>
            </div>
        {/each}
    </div>
{/if}

<style lang="postcss">
    @reference 'tailwindcss';

    .bars-container {
        @apply bg-white;
    }

    .bar-row {
        height: 6px;
        @apply rounded-full overflow-hidden bg-gray-100;
    }

    .bar-fill {
        height: 100%;
        @apply rounded-full;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 3px;
    }
</style>
