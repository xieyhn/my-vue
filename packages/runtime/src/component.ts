import { VNode } from './vnode'

export interface ComponentInstance {
  state: Record<string, any>
  vnode: VNode
  // 组件渲染的内容
  subTree?: VNode
  isMounted: boolean
  update?: () => void
}
