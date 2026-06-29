<script lang="ts">
    import { formatDelta, assert } from '$lib/common';
    import type { Player } from '$lib/data.svelte';

    const FULL_TURN_POINTS = 20; // how many points is a complete rotation of the dial
    const DIAL_RADIUS = 36;
    const DIAL_WIDTH = 18;
    const HOLE_RADIUS = 7.5;
    const CENTER_BUTTON_RADIUS = 22;
    const OFFSET_ANGLE = Math.PI / 2; // to have the first player at the top

    type Props = {
        players: Player[];
        onpress: (playerId: Player['id'], delta: number) => void; // callback when the button is pressed
    };
    const { players, onpress }: Props = $props();

    let activeHole: number | null = $state(null); // the hole selected
    let activePlayer: Player | null = $state(null); // the current player for the active hole
    let active = $derived(activeHole != null); // is the dial being turned?

    // Position for each button/hole
    let holes: { idx: number; angle: number; player: Player }[] = $derived.by(() => {
        const n = players.length;
        return players.map((p, i) => {
            const angle = (-i * Math.PI * 2) / n + OFFSET_ANGLE;
            return {
                idx: i,
                player: p,
                angle,
            };
        });
    });

    let totalRotation = $state(0); // total rotation of the dial, goes beyond 2π
    // FIXME: If I don't add (totalRotation * 0) here, the derived value doesn't **always** update, only some times
    //        Looking at the totalRotation signal, it's reactions array doesn't contain the currentAngle derived signal
    //        I believe this happens because totalRotation is not always read (depends on activeHole)
    //        TODO: Create a minimal example to reproduce it and report it to Svelte
    let currentAngle = $derived(
        totalRotation * 0 + (activeHole != null ? holes[activeHole].angle - totalRotation : 0),
    ); // angle of the active hole, including initial hole offset

    let currentPoints = $state(0); // current points for the active player
    let extraPoints = $derived(Math.round((totalRotation * FULL_TURN_POINTS) / (Math.PI * 2))); // points being added to the current points

    function setupEvents(svg: SVGElement) {
        // Function to convert client coordinates to SVG coordinates
        const transform = ([clientX, clientY]: [number, number]) => {
            const bbox = svg.getBoundingClientRect();
            const x = clientX - (bbox.left + bbox.width / 2);
            const y = clientY - (bbox.top + bbox.height / 2);
            return [x, y];
        };

        let prevAngle: number | null = null;
        let latestCoords: [number, number] | null = null;
        const updateRotation = () => {
            if (latestCoords == null) return;
            const [x, y] = transform(latestCoords);
            latestCoords = null;
            let angle = Math.atan2(y, x);
            if (prevAngle == null) {
                prevAngle = angle;
                return;
            }
            let delta = angle - prevAngle;
            prevAngle = angle;
            if (delta > Math.PI) {
                delta -= Math.PI * 2;
            } else if (delta < -Math.PI) {
                delta += Math.PI * 2;
            }
            totalRotation += delta;
        };

        let updateScheduled = false;
        const mouseMoveHandler = (ev: PointerEvent) => {
            latestCoords = [ev.clientX, ev.clientY];
            if (updateScheduled) return;
            updateScheduled = true;
            requestAnimationFrame(() => {
                updateScheduled = false;
                updateRotation();
            });
        };

        const mouseUpHandler = () => {
            resetState();
            svg.removeEventListener('pointermove', mouseMoveHandler);
            svg.removeEventListener('pointerup', mouseUpHandler);
        };

        const resetState = () => {
            activeHole = null;
            prevAngle = null;
            latestCoords = null;
            updateScheduled = false;
            currentPoints += extraPoints;
            totalRotation = 0; // implies extraPoints = 0
            if (currentPoints == 0) {
                activePlayer = null;
            }
        };

        const mainButtonClicked = () => {
            if (activePlayer == null) return;
            if (active) return;
            assert(extraPoints == 0, 'extra points should be 0 when pressing the main button');
            onpress(activePlayer.id, currentPoints);
            currentPoints = 0; // points were assigned, so reset to 0
            resetState();
        };

        const mouseDownHandler = (ev: PointerEvent) => {
            ev.preventDefault();

            // Main button
            if ((ev.target as SVGElement).getAttribute('data-main-button') === 'true') {
                mainButtonClicked();
                return;
            }

            // Hole
            const rawIndex = (ev.target as SVGElement).getAttribute('data-player-index');
            if (rawIndex != null) {
                activeHole = parseInt(rawIndex);
                if (activePlayer !== holes[activeHole].player) {
                    currentPoints = 0; // Reset points if the player changed
                }
                activePlayer = holes[activeHole].player;
                // Capture the pointer  even if the finger leaves the SVG boundary.
                svg.setPointerCapture(ev.pointerId);
                svg.addEventListener('pointermove', mouseMoveHandler);
                svg.addEventListener('pointerup', mouseUpHandler);
            }
        };

        svg.addEventListener('pointerdown', mouseDownHandler);
        return {
            destroy() {
                mouseUpHandler();
                svg.removeEventListener('pointerdown', mouseDownHandler);
            },
        };
    }
</script>

<div class="dial-container flex">
    <svg viewBox="0 0 100 100" use:setupEvents class="select-none" style="touch-action: none;">
        <!-- Move origin to the center -->
        <g transform="translate(50, 50)">
            <!-- Dial rail outer glow -->
            <circle
                cx="0"
                cy="0"
                r={DIAL_RADIUS}
                stroke="#1e293b"
                stroke-width={DIAL_WIDTH + 2}
                fill="transparent"
            />
            <!-- Dial rail -->
            <circle
                cx="0"
                cy="0"
                r={DIAL_RADIUS}
                stroke="#334155"
                stroke-width={DIAL_WIDTH}
                fill="transparent"
            />
            <!-- Dial rail inner highlight -->
            <circle
                cx="0"
                cy="0"
                r={DIAL_RADIUS}
                stroke="#475569"
                stroke-width="1"
                fill="transparent"
            />

            <!-- Center button shadow -->
            <circle cx="1" cy="1.5" r={CENTER_BUTTON_RADIUS} fill="rgba(0,0,0,0.35)" />
            <!-- Center button -->
            <g class="dial-button cursor-pointer">
                <circle
                    cx="0"
                    cy="0"
                    r={CENTER_BUTTON_RADIUS}
                    stroke="rgba(255,255,255,0.15)"
                    stroke-width="1"
                    fill={activePlayer?.color ?? '#1e293b'}
                    data-main-button="true"
                />
                <!-- y=1 so text looks centered -->
                <text
                    x="0"
                    y="1"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-size="16"
                    fill="white"
                    font-weight="bold"
                    data-main-button="true"
                >
                    {formatDelta(currentPoints + extraPoints)}
                </text>
            </g>

            <!-- Holes -->
            {#if !active}
                {#each holes as b}
                    {@render hole(b.angle, b.idx, b.player)}
                {/each}
            {/if}

            <!-- Moving circle -->
            {#if active}
                {@render hole(currentAngle, activeHole, activePlayer)}
            {/if}
        </g>
    </svg>
</div>

{#snippet hole(angle: number, index: number | null, player: Player | null)}
    {#if player != null}
        {@const x = Math.cos(angle) * DIAL_RADIUS}
        {@const y = -Math.sin(angle) * DIAL_RADIUS}
        <g class="cursor-pointer">
            <circle
                cx={x}
                cy={y}
                r={HOLE_RADIUS}
                fill={player.color}
                stroke-width="0.5"
                stroke="#0f172a"
                data-player-index={index}
            />
            <text
                {x}
                y={y + 1}
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="8"
                font-weight="bold"
                stroke="black"
                stroke-width="0.5"
                fill="white"
                data-player-index={index}
            >
                {player.name.charAt(0)}
            </text>
        </g>
    {/if}
{/snippet}

<style>
    .dial-container {
        max-width: 100%;
        max-height: 100%;
        flex: 1;
    }
</style>
