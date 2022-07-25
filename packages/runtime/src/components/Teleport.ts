import { VNode } from '../vnode'

export interface Internals {
  mountChildren(container: HTMLElement, vnode: VNode): void
  patchChildren(container: HTMLElement, n1: VNode, n2: VNode): void
}

export const Teleport = {
  _isTeleport: true,

  process(n1: VNode | null, n2: VNode, internals: Internals) {
    const { mountChildren, patchChildren } = internals
    const target = window.document.querySelector(n2.props?.to as string) as HTMLElement
    
    if (n1 === null) {
      n2.el = target
      mountChildren(target, n2)
    } else {
      patchChildren(n1.el as HTMLElement, n1, n2)
      if (n2.props!.to !== n1.props!.to) {
        debugger
      }
    }
  }
}

export function isTeleport(value: unknown): value is typeof Teleport {
  return !!(value && (value as any)._isTeleport)
}
