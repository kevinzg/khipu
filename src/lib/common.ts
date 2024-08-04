/**
 * Parse player names and colors from the query string.
 * @example
 *     parsePlayerPool('#Player1,ff0000;Player2,00ff00;Player3,0000ff');
 *     parsePlayerPool(window.location.search);
 * @param queryString - The query string to parse.
 * @returns An array of player objects with id, name, and color.
 */
export function parsePlayerPool(
    hashString: string,
): Array<{ id: number; name: string; color: string }> {
    const str = hashString.replace(/^#/, '');
    return str
        .split(';')
        .map((str, i) => {
            const [name, color] = str.split(',');
            if (!name || !color) return null;
            return { id: i + 1, name, color: '#' + color };
        })
        .filter((x) => x != null);
}

export function formatDelta(delta: number): string {
    return delta > 0 ? `+${delta}` : `${delta}`;
}

export function assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
        if (typeof window !== 'undefined') {
            window.alert(`Assertion failed: ${message}`);
        }
        throw new Error(message);
    }
}

export function loop(
    duration: number,
    callback: (elapsedTime: number) => void,
    end: () => void,
): void {
    const startTime = performance.now();

    function animate(currentTime: number) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime < duration) {
            requestAnimationFrame(animate);
        } else {
            end();
        }
        callback(elapsedTime);
    }

    requestAnimationFrame(animate);
}

export function longpress(node: HTMLButtonElement, threshold = 500) {
    const handler = () => {
        const timeout = setTimeout(() => {
            node.dispatchEvent(new CustomEvent('longpress'));
        }, threshold);

        const cancel = (ev: PointerEvent) => {
            clearTimeout(timeout);
            // TODO: this doesn't prevent the click event from firing
            ev.stopPropagation();
            ev.preventDefault();
            node.removeEventListener('pointermove', cancel);
            node.removeEventListener('pointerup', cancel);
        };

        node.addEventListener('pointermove', cancel);
        node.addEventListener('pointerup', cancel);
    };

    node.addEventListener('pointerdown', handler);

    return {
        destroy() {
            node.removeEventListener('pointerdown', handler);
        },
    };
}
