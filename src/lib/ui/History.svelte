<script lang="ts">
    import { formatDelta } from '$lib/common';
    import type { Data } from '$lib/data.svelte';
    const { data }: { data: Data } = $props();

    function deltaColor(delta: number) {
        if (delta < 0) {
            return 'text-red-600';
        } else if (delta > 0) {
            return 'text-green-600';
        }
        return 'text-gray-300';
    }
</script>

<div class="flex flex-col space-y-2 my-2 mx-2 text-gray-900">
    {#each data.history as h, idx (idx)}
        <div class="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-4">
                <!-- Circle -->
                <div class="h-6 w-6 rounded-full" style="background-color: {h.color}"></div>
                <div>
                    <h2 class="text-xl font-semibold">{h.name}</h2>
                </div>
            </div>
            <div class="flex flex-row space-x-3">
                <div class={`text-2xl font-medium ${deltaColor(h.delta)}`}>
                    {formatDelta(h.delta)}
                </div>
                <div class={`text-2xl font-semibold w-[4ch] text-right`}>{h.score}</div>
            </div>
        </div>
    {/each}
</div>
