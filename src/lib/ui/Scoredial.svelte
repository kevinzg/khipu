<script lang="ts">
    import { formatDelta } from '$lib/common';
    import type { Player } from '$lib/data.svelte';

    const FULL_TURN_POINTS = 20; // how many points is a complete rotation of the dial
    const DIAL_RADIUS = 36;
    const DIAL_WIDTH = 18;
    const HOLE_RADIUS = 7.5;
    const CENTER_BUTTON_RADIUS = 22;
    const OFFSET_ANGLE = Math.PI / 2; // to have the first player at the top

    type Props = {
        players: Player[];
        onpress: (idx: Player['id'], delta: number) => void; // callback when the button is pressed
    };

    const { players, onpress }: Props = $props();

    let active = $state(false); // is the dial being turned?
    let activePlayer = $state(0); // the player selected

    // Position of hole being moved
    let currentAngle = $state(0); // current angle of the dial being turned
    let currentX = $derived(Math.cos(currentAngle) * DIAL_RADIUS);
    let currentY = $derived(Math.sin(currentAngle) * DIAL_RADIUS);

    let totalTurn = $state(0); // how much the dial has turned
    let totalPoints = $derived(Math.round((totalTurn * FULL_TURN_POINTS) / (Math.PI * 2)));
    let totalPointsLabel = $derived(formatDelta(totalPoints));

    let currentColor = $derived(
        totalTurn !== 0 && players.length > 0 ? players[activePlayer].color : null,
    );

    // Position for each button/hole
    let buttons: { idx: number; x: number; y: number; name: string; color: string }[] = $derived.by(
        () => {
            const n = players.length;
            return players.map((p, i) => {
                const angle = (-i * Math.PI * 2) / n + OFFSET_ANGLE;
                return {
                    idx: i,
                    name: p.name,
                    color: p.color,
                    x: Math.cos(angle) * DIAL_RADIUS,
                    y: -Math.sin(angle) * DIAL_RADIUS,
                };
            });
        },
    );

    function setupEvents(svg: SVGElement) {
        let prevAngle = 0;

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

        const mouseMoveHandler = (ev: MouseEvent | TouchEvent) => {
            const [x, y] = transform(getCoords(ev));
            let angle = Math.atan2(y, x);
            if (angle < 0) {
                angle += Math.PI * 2;
            }

            let delta = angle - prevAngle;
            prevAngle = angle;

            if (delta > Math.PI) {
                delta -= Math.PI * 2;
            } else if (delta < -Math.PI) {
                delta += Math.PI * 2;
            }

            totalTurn += delta;
            currentAngle = angle;
        };

        const mouseUpHandler = () => {
            active = false;
            currentAngle = 0;
            window.removeEventListener('mousemove', mouseMoveHandler);
            window.removeEventListener('mouseup', mouseUpHandler);
            window.removeEventListener('touchmove', mouseMoveHandler);
            window.removeEventListener('touchend', mouseUpHandler);
        };

        const mouseDownHandler = (ev: MouseEvent | TouchEvent) => {
            ev.preventDefault(); // Disable scrolling for touch events
            // Main button
            if ((ev.target as SVGElement).getAttribute('data-main-button') === 'true') {
                onpress(players[activePlayer].id, totalPoints);
                totalTurn = 0;
                return;
            }

            // Hole
            const rawIndex = (ev.target as SVGElement).getAttribute('data-player-index');
            if (rawIndex == null || /^\d+$/.test(rawIndex) === false) {
                return;
            }
            activePlayer = parseInt(rawIndex);
            totalTurn = 0;
            const [x, y] = transform(getCoords(ev));
            const initialAngle = Math.atan2(y, x);
            currentAngle = initialAngle;
            prevAngle = initialAngle;
            active = true;
            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
            window.addEventListener('touchmove', mouseMoveHandler);
            window.addEventListener('touchend', mouseUpHandler);
        };
        svg.addEventListener('mousedown', mouseDownHandler);
        svg.addEventListener('touchstart', mouseDownHandler);
        return {
            destroy() {
                mouseUpHandler();
                svg.removeEventListener('mousedown', mouseDownHandler);
                svg.removeEventListener('touchstart', mouseDownHandler);
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
                    fill={currentColor ?? '#e2e8f0'}
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
                    {totalPointsLabel}
                </text>
            </g>

            {#if !active}
                <!-- Holes for each player -->
                {#each buttons as b}
                    <g class="cursor-pointer">
                        <circle
                            cx={b.x}
                            cy={b.y}
                            r={HOLE_RADIUS}
                            fill={b.color}
                            stroke-width="0.5"
                            stroke="#0f172a"
                            data-player-index={b.idx}
                        />
                        <text
                            x={b.x}
                            y={b.y + 1}
                            text-anchor="middle"
                            dominant-baseline="middle"
                            font-size="8"
                            font-weight="bold"
                            stroke="black"
                            stroke-width="0.5"
                            fill="white"
                            data-player-index={b.idx}
                        >
                            {b.name.charAt(0)}
                        </text>
                    </g>
                {/each}
            {/if}

            <!-- Moving circle -->
            {#if active}
                <circle
                    cx={currentX}
                    cy={currentY}
                    r={HOLE_RADIUS}
                    stroke="#0f172a"
                    stroke-width="0.5"
                    fill={currentColor}
                />
            {/if}
        </g>
    </svg>
</div>

<style>
    .dial-container {
        max-width: 100%;
        max-height: 100%;
        flex: 1;
    }
</style>
