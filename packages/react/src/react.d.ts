declare module 'react' {
  export type EffectCallback = () => void | (() => void);
  export interface MutableRefObject<T> { current: T; }
  export function useRef<T>(initialValue: T): MutableRefObject<T>;
  export function useEffect(effect: EffectCallback, dependencies?: readonly unknown[]): void;
  export function useSyncExternalStore<T>(subscribe: (listener: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
}
