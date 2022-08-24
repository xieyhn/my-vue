import { ShapeFlags } from '@my-vue/shared';
import { ComponentInternalInstance } from './component';

export function initSlots(instance: ComponentInternalInstance) {
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = { ...vnode.children as any }
  } else {
    instance.slots = {}
  }
}

export function updateSlots(preSlots: Record<string, any>, nextSlots: Record<string, any>) {
  for(let key in nextSlots) {
    preSlots[key] = nextSlots[key]
  }
  for(let key in preSlots) {
    if (!(key in nextSlots)) {
      delete preSlots[key]
    }
  }
}
