import { onMounted, onUnmounted, shallowRef } from 'vue';
import { createGait } from '@gaitjs/core';
import type { Gait, GaitConfig, GaitSnapshot } from '@gaitjs/core';

export function useGait(config?: GaitConfig): { readonly gait: { value: Gait | undefined }; readonly snapshot: { value: GaitSnapshot | undefined } } {
  const gait = shallowRef<Gait | undefined>(undefined);
  const snapshot = shallowRef<GaitSnapshot | undefined>(undefined);
  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    const instance = createGait(config);
    gait.value = instance;
    unsubscribe = instance.subscribe((next) => { snapshot.value = next; });
    instance.start();
  });
  onUnmounted(() => {
    unsubscribe?.();
    gait.value?.destroy();
  });
  return { gait, snapshot };
}
