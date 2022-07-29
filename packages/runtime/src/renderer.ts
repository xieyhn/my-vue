import { ReactiveEffect } from "@my-vue/reactivity";
import { isArray, isObject, isString, ShapeFlags } from "@my-vue/shared";
import { ComponentInternalInstance, createComponentInstance, setupComponent } from "./component";
import { callLifeCycleHook, LifeCycleHooks } from "./componentLifeCycle";
import { hasPropsChanged, updateProps } from "./componentProps";
import { Teleport } from "./components/Teleport";
import { patchProp } from "./patchProp";
import { queueJob } from "./scheduler";
import { TextSymbol, VNode, isSameVNode, normalize, FragmentSymbol, ArrayChildren } from "./vnode";

/**
 * mount
 * 将 vnode 挂载到指定容器
 */
function mount(vnode: VNode, contianer: HTMLElement, parentComponent?: ComponentInternalInstance) {
  if (isString(vnode.type)) {
    mountElement(vnode, contianer)
  } else if (vnode.type === TextSymbol) {
    mountTextNode(vnode, contianer)
  } else if (vnode.type === FragmentSymbol) {
    mountFragment(vnode, contianer)
  } else if (isObject(vnode.type)) {
    mountComponent(vnode, contianer, parentComponent)
  }
}

/**
 * 挂载元素
 */
function mountElement(vnode: VNode, contianer: HTMLElement) {
  const el = window.document.createElement(vnode.type as string)
  vnode.el = el

  if (vnode.props) {
    for (let key in vnode.props) {
      // 这是当成添加 prop 使用
      patchProp(el, key, undefined, vnode.props[key])
    }
  }

  // 子节点
  if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 子节点是文本节点
    vnode.el!.textContent = vnode.children as string
  } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 子节点是数组，挂载子节点数组
    mountChildren(vnode.children as any[], vnode.el)
  }

  contianer.appendChild(el)
}

/**
 * 挂载文本节点
 */
function mountTextNode(vnode: VNode, contianer: HTMLElement) {
  const n = window.document.createTextNode(vnode.children as string)
  vnode.el = n

  contianer.appendChild(n)
}

/**
 * 挂载 Fragment
 */
function mountFragment(vnode: VNode, contianer: HTMLElement) {
  const n = window.document.createTextNode('')
  vnode.el = n
  contianer.appendChild(n)
  mountChildren(vnode.children as ArrayChildren, vnode.el!.parentElement!)
}

/**
 * 挂载组件
 */
function mountComponent(vnode: VNode, container: HTMLElement, parentComponent?: ComponentInternalInstance) {
  const instance = createComponentInstance(vnode, parentComponent)
  setupComponent(instance)
  setupRenderEffect(container, instance)
}

/**
 * mountChildren
 * 挂载 vnode 的 children
 */
export function mountChildren(children: ArrayChildren, container: HTMLElement) {
  for(let i = 0; i < children.length; i++) {
    normalize(children, i)

    mount(children[i] as VNode, container)
  }
}

/**
 * unmount
 * 将 vnode 卸载
 */
 export function unmount(vnode: VNode | undefined) {
  if (!vnode) return
  
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    unmountComponent(vnode)
  } else if (vnode.shapeFlag & ShapeFlags.TELEPORT) {
    unmountChildren(vnode.children as ArrayChildren)
  } else {
    if (vnode.el) {
      vnode.el.parentNode!.removeChild(vnode.el)
      if (vnode.type === FragmentSymbol) {
        unmountChildren(vnode.children as ArrayChildren)
      }
    }
  }
}

/**
 * 组件卸载
 */
function unmountComponent(vnode: VNode) {
  const instance = vnode.component!
  callLifeCycleHook(instance, LifeCycleHooks.BEFORE_UNMOUNT)
  unmount(instance.subTree)
  callLifeCycleHook(instance, LifeCycleHooks.UNMOUNTED)
}

/**
 * 卸载 vnode.children
 */
function unmountChildren(children: ArrayChildren) {
  if (!children || !isArray(children)) return
  ;(children as VNode[]).forEach(child => {
    unmount(child)
  })
}

/**
 * 组件更新前的操作
 */
function updateComponentPreRender(instance: ComponentInternalInstance) {
  if (instance.next) {
    const next = instance.next
    instance.vnode = next
    instance.next = undefined
    // 更新实例上的 props，接着走 render
    updateProps(instance.props!, next.props as any || {})
  }
}

/**
 * 组件 effect
 */
function setupRenderEffect(container: HTMLElement, instance: ComponentInternalInstance) {
  const componentUpdate = () => {
    // normalize!!!
    if (!instance.isMounted) {
      callLifeCycleHook(instance, LifeCycleHooks.BEFORE_MOUNT)
      instance.subTree = instance.render!.call(instance.proxy!)
      mount(instance.subTree, container, instance)
      instance.isMounted = true
      callLifeCycleHook(instance, LifeCycleHooks.MOUNTED)
    } else {
      updateComponentPreRender(instance)

      const newSubTree = instance.render!.call(instance.proxy!)
      patch(instance.subTree!, newSubTree, container, instance)
      instance.subTree = newSubTree
    }
  }

  const effect = new ReactiveEffect(componentUpdate, () => {
    queueJob(instance.update!)
  })

  instance.update = effect.run.bind(effect)
  instance.update()
}

/**
 * 比对元素上的 props
 */
function patchProps(
  el: HTMLElement,
  preProps: Record<string, unknown> | null,
  nextProps: Record<string, unknown> | null
) {
  preProps = preProps || {}
  nextProps = nextProps || {}

  for (let key in nextProps) {
    patchProp(el, key, preProps[key], nextProps[key])
  }

  for (let key in preProps) {
    if (!(key in nextProps)) {
      patchProp(el, key, null, null)
    }
  }
}

/**
 * 比对元素的子节点
 */
export function patchChildren(n1: VNode, n2: VNode, container: HTMLElement) {
  const c1 = n1.children as VNode[] | null
  const c2 = n2.children as VNode[] | null

  if (!c2) {
    // 新 空
    if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(n1.children as ArrayChildren)
    }
    container.textContent = ''
  } else if (n2.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 新 文本
    if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(n1.children as ArrayChildren)
    }
    container.textContent = n2.children as string
  } else {
    // 新 数组
    if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // TODO: diff，目前假设长度相同，且只做修改
      for(let i = 0; i < c2.length; i++) {
        patch(c1![i], c2[i], container)
      }
    } else if (n1.shapeFlag * ShapeFlags.TEXT_CHILDREN) {
      container.textContent = ''
      mountChildren(n2.children as any, n1.el as HTMLElement)
    }
  }
}

/**
 * 处理文本节点的 patch
 * @param n1 老的 vnode
 * @param n2 新的 vnode
 */
function processText(n1: VNode | null, n2: VNode, contianer: HTMLElement) {
  const textContent = n2.children as string
  if (n1 === null) {
    mount(n2, contianer)
  } else {
    // 内容更新
    n2.el = n1.el
    ;(n2.el as Text).textContent = textContent
  }
}

/**
 * 处理 Fragment
 */
function processFragment(n1: VNode | null, n2: VNode, contianer: HTMLElement) {
  if (n1 === null) {
    // 新增
    mount(n2, contianer)
  } else {
    n2.el = n1.el
    // 子节点更新
    patchChildren(n1, n2, contianer)
  }
}

/**
 * 是否需要重新更新组件
 */
function shouldUpdateComponent(n1: VNode, n2: VNode) {
  const { props: preProps = {}, children: children1 } = n1
  const { props: nextProps = {}, children: children2 } = n2

  // children：插槽变化后需要重新渲染
  if (children1 || children2) {
    return true
  }

  return hasPropsChanged(preProps as any, nextProps as any)
}

/**
 * processComponent 分支逻辑，更新组件
 */
function updateComponent(n1: VNode, n2: VNode) {
  const instance = n2.component = n1!.component

  if (shouldUpdateComponent(n1, n2)) {
    instance!.next = n2

    // To: setupRenderEffect => componentUpdate
    instance!.update?.()
  }
}

/**
 * 处理组件
 */
function processComponent(n1: VNode | null, n2: VNode, contianer: HTMLElement, parentComponent?: ComponentInternalInstance) {
  if (n1 === null) {
    mount(n2, contianer, parentComponent)
  } else {
    updateComponent(n1, n2)
  }
}

/**
 * processElement 更新逻辑
 */
function patchElement(n1: VNode, n2: VNode) {
  const el = n2.el = n1.el as HTMLElement
  // 处理 props
  patchProps(el, n1.props, n2.props)
  // 处理 children
  patchChildren(n1, n2, el)
}

/**
 * 处理 html 节点的的 patch
 */
function processElement(n1: VNode | null, n2: VNode, contianer: HTMLElement) {
  if (n1 === null) {
    mount(n2, contianer)
  } else {
    patchElement(n1, n2)
  }
}

/**
 * patch 两个 vnode，产生对实际 dom 的更新
 */
export function patch(n1: VNode | null, n2: VNode, contianer: HTMLElement, parentComponent?: ComponentInternalInstance) {
  if (n1 === n2) return

  if (n1 && !isSameVNode(n1, n2)) {
    // 不是同一个节点将之前的节点卸载
    unmount(n1)
    n1 = null
  }

  switch (n2.type) {
    case TextSymbol:
      // 这是一个文本节点
      processText(n1, n2, contianer)
      break
    case FragmentSymbol:
      processFragment(n1, n2, contianer)
      break;
    default:
      if (n2.shapeFlag & ShapeFlags.TELEPORT) {
        (n2.type as typeof Teleport).process(n1, n2)
      } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(n1, n2, contianer, parentComponent)
      } else {
        // 是一个 HTML 元素的 vnode
        processElement(n1, n2, contianer)
      }
      break
  }
}

/**
 * render 方法
 * 将一个 vnode 节点渲染一个 HTML 容器中
 */
export function render(vnode: VNode | null, contianer: HTMLElement) {
  const root = contianer as HTMLElement & { _vnode?: VNode }
  if (!vnode) {
    unmount(root._vnode)
  } else {
    patch(root._vnode || null, vnode, contianer)
    root._vnode = vnode
  }
}
