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
            const centerX = bbox.left + bbox.width / 2;
            const centerY = bbox.top + bbox.height / 2;
            const x = clientX - centerX;
            const y = clientY - centerY;
            return [x, y];
        };

        const getCoords = (ev: MouseEvent | TouchEvent): [number, number] => {
            if ('targetTouches' in ev) {
                const t = ev.targetTouches[0];
                if (!t) {
                    throw new Error('expected touch');
                }
                return [t.clientX, t.clientY];
            }
            return [ev.clientX, ev.clientY];
        };

        let prevAngle: number | null = null;
        const mouseMoveHandler = (ev: MouseEvent | TouchEvent) => {
            const [x, y] = transform(getCoords(ev));
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

        const mouseUpHandler = () => {
            resetState();
            window.removeEventListener('pointermove', mouseMoveHandler);
            window.removeEventListener('pointerup', mouseUpHandler);
        };

        const resetState = () => {
            activeHole = null;
            prevAngle = null;
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

        const mouseDownHandler = (ev: MouseEvent | TouchEvent) => {
            ev.preventDefault(); // Disable scrolling for touch events

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
                window.addEventListener('pointermove', mouseMoveHandler);
                window.addEventListener('pointerup', mouseUpHandler);
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
    <svg viewBox="0 0 100 100" use:setupEvents class="select-none">
        <!-- Move origin to the center -->
        <g transform="translate(50, 50)">
            <!-- Dial rail -->
            <circle
                cx="0"
                cy="0"
                r={DIAL_RADIUS}
                stroke="#334155"
                stroke-width={DIAL_WIDTH}
                fill="transparent"
            />

            <!-- Center button -->
            <g class="dial-button cursor-pointer">
                <circle
                    cx="0"
                    cy="0"
                    r={CENTER_BUTTON_RADIUS}
                    stroke="black"
                    stroke-width="1"
                    fill={activePlayer?.color ?? '#e2e8f0'}
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
                    stroke="black"
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

{#snippet hole(angle, index, player)}
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
{/snippet}

<style>
    .dial-container {
        max-width: 100%;
        max-height: 100%;
        flex: 1;
    }
</style>
