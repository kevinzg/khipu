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

export function assert(condition: boolean, message: string): void {
    if (!condition) {
        if (typeof window !== 'undefined') {
            window.alert(`Assertion failed: ${message}`);
        }
        throw new Error(message);
    }
}
