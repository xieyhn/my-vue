import { mountChildren, patchChildren } from '../renderer'
import { ArrayChildren, VNode } from '../vnode'

export const Teleport = {
  _isTeleport: true,

  process(n1: VNode | null, n2: VNode) {
    const target = window.document.querySelector(n2.props?.to as string) as HTMLElement
    
    if (n1 === null) {
      n2.target = target
      mountChildren(n2.children as ArrayChildren, target)
    } else {
      patchChildren(n1, n2, n1.target!)
      if (n2.props!.to !== n1.props!.to) {
        (n2.children as VNode[]).forEach(vnode => {
          target.appendChild(vnode.el!)
        })
      }
    }
  }
}

export function isTeleport(value: unknown): value is typeof Teleport {
  return !!(value && (value as any)._isTeleport)
}
