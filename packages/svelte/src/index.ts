import { readable } from 'svelte/store';
import { createGait } from '@gait/core';
import type { GaitConfig, GaitSnapshot } from '@gait/core';

export function createGaitStore(config?: GaitConfig) {
  return readable<GaitSnapshot | undefined>(undefined, (set) => {
    const gait = createGait(config);
    const unsubscribe = gait.subscribe(set);
    gait.start();
    return () => {
      unsubscribe();
      gait.destroy();
    };
  });
}
