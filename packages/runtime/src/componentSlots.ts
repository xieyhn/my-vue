import { ShapeFlags } from '@my-vue/shared';
import { ComponentInternalInstance } from './component';

export function initSlots(instance: ComponentInternalInstance) {
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = vnode.children as any || {}
  } else {
    instance.slots = {}
  }
}
