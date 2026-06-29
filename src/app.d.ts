// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

declare module 'svelte/elements' {
    // T is required to match the original HTMLAttributes signature for declaration merging.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T extends EventTarget> {
        onlongpress?: (event: CustomEvent) => void;
    }
}

export {};
