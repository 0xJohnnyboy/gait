declare module 'vue' {
  export interface Ref<T> { value: T; }
  export function shallowRef<T>(value: T): Ref<T>;
  export function onMounted(callback: () => void): void;
  export function onUnmounted(callback: () => void): void;
}
