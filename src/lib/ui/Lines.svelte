<script lang="ts">
    import type { Data } from '$lib/data.svelte';
    const { data }: { data: Data } = $props();

    const barHeight = 4;
    const graphHeight = $derived(barHeight * data.summary.length);
    // TODO: negative scores?
    const bars = $derived.by(() => {
        const fullWidth = Math.max(120, ...data.summary.map((p) => p.score));
        const sorted = data.summary.sort((a, b) => b.score - a.score).toReversed();
        return sorted.map((p, idx) => {
            return {
                color: p.player.color,
                width: (100 * p.score) / fullWidth,
                y: graphHeight - (1 + idx) * barHeight,
            };
        });
    });
</script>

<div class="">
    <svg
        width="100%"
        height={graphHeight}
        viewBox={`0 0 100 ${graphHeight}`}
        preserveAspectRatio="none"
    >
        {#each bars as b}
            <rect class="bar" width={b.width} height={barHeight} x="0" y={b.y} fill={b.color}
            ></rect>
        {/each}
    </svg>
</div>
