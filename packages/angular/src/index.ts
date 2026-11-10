import { afterNextRender, inject, signal } from '@angular/core';
import { createGait } from '@gaitjs/core';
import type { Gait, GaitConfig, GaitSnapshot } from '@gaitjs/core';

export interface GaitDestroyScope {
  onDestroy(callback: () => void): void;
}

export class GaitAdapter {
  private readonly current = signal<GaitSnapshot | undefined>(undefined);
  private gait: Gait | undefined;
  private unsubscribe: (() => void) | undefined;

  readonly snapshot = this.current.asReadonly();

  start(config?: GaitConfig, scope?: GaitDestroyScope): void {
    if (this.gait !== undefined) return;
    this.gait = createGait(config);
    this.unsubscribe = this.gait.subscribe((next) => this.current.set(next));
    afterNextRender(() => this.gait?.start());
    scope?.onDestroy(() => this.destroy());
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.gait?.destroy();
    this.gait = undefined;
  }

  get instance(): Gait | undefined {
    return this.gait;
  }
}

export { inject };
