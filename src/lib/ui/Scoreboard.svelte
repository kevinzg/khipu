<script lang="ts">
    import type { Data } from '$lib/data.svelte';
    const { data, firstPlayer }: { data: Data; firstPlayer: number | null } = $props();
</script>

<div class="flex flex-col space-y-2 my-2 mx-2">
    {#each data.summary as p, idx (p.player.id)}
        <div
            class="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg"
            class:highlight={idx === firstPlayer}
        >
            <div class="flex items-center space-x-4">
                <!-- Circle -->
                <div class="h-6 w-6 rounded-full" style="background-color: {p.player.color}"></div>
                <div>
                    <h2 class="text-xl font-semibold">{p.player.name}</h2>
                </div>
            </div>
            <div class="text-2xl font-bold">
                {#if p.rank === 1 && p.score > 0}
                    👑
                {:else if p.showTurtle}
                    🐢
                {/if}
                {p.score}
            </div>
        </div>
    {/each}
</div>

<style lang="postcss">
    .highlight {
        @apply bg-yellow-200;
    }
</style>
