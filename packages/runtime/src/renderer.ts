import { ReactiveEffect } from "@my-vue/reactivity";
import { isArray, isObject, isString, ShapeFlags } from "@my-vue/shared";
import { ComponentInternalInstance, createComponentInstance, setupComponent } from "./component";
import { callLifeCycleHook, LifeCycleHooks } from "./componentLifeCycle";
import { hasPropsChanged, updateProps } from "./componentProps";
import { patchProp } from "./patchProp";
import { queueJob } from "./scheduler";
import { TextSymbol, VNode, isSameVNode, normalize, FragmentSymbol } from "./vnode";

/**
 * mount
 * 将 vnode 挂载到指定容器
 */
function mount(contianer: HTMLElement, vnode: VNode) {
  if (isString(vnode.type)) {
    mountElement(contianer, vnode)
  } else if (vnode.type === TextSymbol) {
    mountTextNode(contianer, vnode)
  } else if (vnode.type === FragmentSymbol) {
    mountFragment(contianer, vnode)
  } else if (isObject(vnode.type)) {
    mountComponent(contianer, vnode)
  }
}

/**
 * 挂载元素
 */
function mountElement(contianer: HTMLElement, vnode: VNode) {
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
    mountChildren(vnode)
  }

  contianer.appendChild(el)
}

/**
 * 挂载文本节点
 */
function mountTextNode(contianer: HTMLElement, vnode: VNode) {
  const n = window.document.createTextNode(vnode.children as string)
  vnode.el = n

  contianer.appendChild(n)
}

/**
 * 挂载 Fragment
 */
function mountFragment(contianer: HTMLElement, vnode: VNode) {
  const n = window.document.createTextNode('')
  vnode.el = n
  contianer.appendChild(n)
  mountChildren(vnode)
}

/**
 * 挂载组件
 */
function mountComponent(container: HTMLElement, vnode: VNode) {
  const instance = createComponentInstance(vnode)
  setupComponent(instance)
  setupRenderEffect(container, instance)
}

/**
 * mountChildren
 * 挂载 vnode 的 children
 */
function mountChildren(vnode: VNode) {
  let target: HTMLElement

  if (vnode.type === FragmentSymbol) {
    target = vnode.el!.parentElement!
  } else {
    target = vnode.el as HTMLElement
  }

  const children = vnode.children as VNode[]
  for(let i = 0; i < children.length; i++) {
    children[i] = normalize(children[i])
    mount(target, children[i])
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
  } else {
    if (vnode.el) {
      vnode.el.parentNode!.removeChild(vnode.el)
      if (vnode.type === FragmentSymbol) {
        unmountChildren(vnode)
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
function unmountChildren(vnode: VNode) {
  const children = vnode.children as VNode[]
  if (!children || !isArray(children)) return

  children.forEach(child => {
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
      mount(container, instance.subTree)
      instance.isMounted = true
      callLifeCycleHook(instance, LifeCycleHooks.MOUNTED)
    } else {
      updateComponentPreRender(instance)

      const newSubTree = instance.render!.call(instance.proxy!)
      patch(container, instance.subTree!, newSubTree)
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
function patchChildren(container: HTMLElement, n1: VNode, n2: VNode) {
  const c1 = n1.children as VNode[] | null
  const c2 = n2.children as VNode[] | null

  if (!c2) {
    // 新 空
    if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(n1)
    }
    container.textContent = ''
  } else if (n2.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 新 文本
    if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(n1)
    }
    container.textContent = n2.children as string
  } else {
    // 新 数组
    if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // TODO: diff，目前假设长度相同，且只做修改
      for(let i = 0; i < c2.length; i++) {
        patch(container, c1![i], c2[i])
      }
    } else if (n1.shapeFlag * ShapeFlags.TEXT_CHILDREN) {
      container.textContent = ''
      mountChildren(n2)
    }
  }
}

/**
 * 处理文本节点的 patch
 * @param n1 老的 vnode
 * @param n2 新的 vnode
 */
function processText(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  const textContent = n2.children as string
  if (n1 === null) {
    mount(contianer, n2)
  } else {
    // 内容更新
    n2.el = n1.el
    ;(n2.el as Text).textContent = textContent
  }
}

/**
 * 处理 Fragment
 */
function processFragment(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === null) {
    // 新增
    mount(contianer, n2)
  } else {
    n2.el = n1.el
    // 子节点更新
    patchChildren(contianer, n1, n2)
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
function processComponent(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === null) {
    mount(contianer, n2)
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
  patchChildren(el, n1, n2)
}

/**
 * 处理 html 节点的的 patch
 */
function processElement(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === null) {
    mount(contianer, n2)
  } else {
    patchElement(n1, n2)
  }
}

/**
 * patch 两个 vnode，产生对实际 dom 的更新
 */
export function patch(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === n2) return

  if (n1 && !isSameVNode(n1, n2)) {
    // 不是同一个节点将之前的节点卸载
    unmount(n1)
    n1 = null
  }

  switch (n2.type) {
    case TextSymbol:
      // 这是一个文本节点
      processText(contianer, n1, n2)
      break
    case FragmentSymbol:
      processFragment(contianer, n1, n2)
      break;
    default:
      if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(contianer, n1, n2)
      } else {
        // 是一个 HTML 元素的 vnode
        processElement(contianer, n1, n2)
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
    patch(contianer, root._vnode || null, vnode)
    root._vnode = vnode
  }
}
