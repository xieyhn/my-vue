import { isArray, isString, ShapeFlags } from "@my-vue/shared"

export const TextSymbol = Symbol('Text')

export type VNodeTypes = string | symbol

export interface VNode {
  __v_isVNode: true
  // 形状标记，标记一些特征，如是否是普通 html 元素、是否是组件、子节点是字符串还是数组等
  shapeFlag: ShapeFlags
  // 节点类型
  type: VNodeTypes
  props: Record<string, unknown> | null
  key: string | number | symbol | null
  children: unknown
  // 真实元素，普通元素，文本节点
  el?: HTMLElement | Text
}

export function isVNode(val: unknown): val is VNode {
  return !!(val && (val as VNode).__v_isVNode)
}

export function isSameVNode(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}

export function createVNode(
  type: VNodeTypes,
  props: Record<string, unknown> | null,
  children: unknown = null
): VNode {
  // 字符串为基本元素类型
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0

  // 判断子节点的类型
  if (children) {
    if (isArray(children)) {
      shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    } else {
      // 文本
      shapeFlag |= ShapeFlags.TEXT_CHILDREN
    }
  }

  const vnode: VNode = {
    __v_isVNode: true,
    shapeFlag,
    type,
    props,
    key: null,
    children
  }

  if (props && props.key) {
    vnode.key = props.key as any
  }

  return vnode
}

export function normalize(value: unknown) {
  if (isString(value)) {
    return createVNode(TextSymbol, null, value)
  } else {
    // isVNode
    const vnode = value as VNode
    normalizeChildren(vnode)
    return vnode
  }
}

/**
 * 将子节统一规范于一个 VNode[]
 */
export function normalizeChildren(vnode: VNode) {
  const { children } = vnode

  if (!children) {
    vnode.children = null
  } else if (isArray(children)) {
    vnode.children = children.map(child => {
      return normalize(child)
    })
  } else {
    vnode.children = [normalize(children)]
  }
}
