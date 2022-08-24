import { ShapeFlags } from "@my-vue/shared"
import { ComponentPublicInstance, getCurrentInstance } from "../component"
import { onMounted, onUpdated } from "../componentLifeCycle"
import { isVNode, VNode, VNodeTypes } from "../vnode"

export const KeepAlive: ComponentPublicInstance = {
  _v_isKeepAlive: true,

  setup(props, { slots }) {
    const cache = new Map<number | VNodeTypes, VNode>();
    const instance = getCurrentInstance()
    const container = window.document.createElement('div')

    let pendingCacheKey: number | VNodeTypes

    onMounted(() => {
      cache.set(pendingCacheKey, instance!.subTree!)
    })

    onUpdated(() => {
      cache.set(pendingCacheKey, instance!.subTree!)
    })

    instance!.ctx.deactivate = (vnode: VNode) => {
      // 将 DOM 移至内存中，不销毁
      container.appendChild(vnode.component!.subTree!.el!)
    }

    instance!.ctx.activate = (vnode: VNode, container: HTMLElement, anchor: ChildNode | null,) => {
      // 将内存中的 DOM 插入
      container.insertBefore(vnode.component!.subTree!.el!, anchor)
    }

    return () => {
      const vnode = slots!.default()

      // 只能缓存状态组件
      if (!isVNode(vnode) || !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode
      }

      const key = vnode.key || vnode.type /* 组件对象 */
      // 标记这个子节点是需要缓存的，不直接卸载，这样在 unmount 中需要对这个标记处理
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE

      const cacheVNode = cache.get(key)
      if (cacheVNode) {
        // 组件进行复用
        vnode.component = cacheVNode.component
        // 标记这个 VNode 是有缓存的，在后续的挂载组件流程中，需要对这个标记处理
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
      } else {
        // 在 onMounted 之后将 key 和子节点的 VNode 缓存起来
        pendingCacheKey = key
      }

      return vnode
    }
  },
}

export function isKeepAlive(value: unknown) {
  return value && !!((value as any)._v_isKeepAlive)
}
