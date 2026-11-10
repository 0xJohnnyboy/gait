declare module 'svelte/store' {
  export interface Readable<T> { subscribe(run: (value: T) => void): () => void; }
  export function readable<T>(value: T, start?: (set: (value: T) => void) => void | (() => void)): Readable<T>;
}
