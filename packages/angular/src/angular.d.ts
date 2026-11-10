declare module '@angular/core' {
  export interface DestroyRef { onDestroy(callback: () => void): void; }
  export function inject<T>(token: T): T;
  export function signal<T>(value: T): { (): T; set(value: T): void; asReadonly(): () => T };
  export function afterNextRender(callback: () => void): void;
}
