import { ReactiveEffect } from "@my-vue/reactivity";
import { isString, ShapeFlags } from "@my-vue/shared";
import { ComponentInstance } from "./component";
import { patchProp } from "./patchProp";
import { queueJob } from "./scheduler";
import { TextSymbol, VNode, isSameVNode, normalize, FragmentSymbol } from "./vnode";

/**
 * 挂载 vnode.children
 */
function mountChildren(contianer: HTMLElement, vnode: VNode) {
  ; (vnode.children as VNode[]).forEach(child => {
    patch(contianer, null, child)
  })
}

/**
 * 挂载 vnode
 */
function mount(contianer: HTMLElement, vnode: VNode) {
  // html 元素
  if (isString(vnode.type)) {
    vnode.el = window.document.createElement(vnode.type)
  }

  // patch props
  if (vnode.props) {
    for (let key in vnode.props) {
      patchProp(vnode.el as HTMLElement, key, undefined, vnode.props[key])
    }
  }

  // 挂载子节点
  if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 子节点是文本节点，拿到 children 第一个即为 TextSymbol 类型的 vnode
    vnode.el!.textContent = (vnode.children as VNode[])[0].children as string
  } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 子节点是数组，挂载子节点数组
    mountChildren(vnode.el as HTMLElement, vnode)
  }

  contianer.appendChild(vnode.el!)
}

/**
 * 卸载 vnode
 */
export function unmount(vnode: VNode | undefined) {
  if (!vnode) return
  if (vnode.type === FragmentSymbol) {
    ;(vnode.children as VNode[]).forEach(vnode => unmount(vnode))
  } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 组件
    unmount(vnode.component?.subTree)
  } else if (vnode.el) {
    vnode.el.parentNode!.removeChild(vnode.el)
  }
}

/**
 * 挂载组件
 */
function mountComponent(contianer: HTMLElement, vnode: VNode) {
  const { setup, render } = vnode.type as any
  const state = setup()

  // 组件实例
  const instance: ComponentInstance = {
    state,
    vnode,
    isMounted: false,
  }

  vnode.component = instance

  const componentUpdate = () => {
    // normalize!!!
    if (!instance.isMounted) {
      instance.subTree = normalize(render.call(instance.state))
      patch(contianer, null, instance.subTree!)
      instance.isMounted = true
    } else {
      const newSubTree = normalize(render.call(instance.state))
      patch(contianer, instance.subTree!, newSubTree)
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
 * 组件卸载
 */
function unmountComponent(vnode: VNode) {
  unmount(vnode)
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
  n2.el = n1.el as HTMLElement

  if (!n1.children && n2.children) {
    // 新增
    (n2.children as VNode[]).forEach(i => {
      mount(container, i)
    })
  } else if (!n2.children && n1.children) {
    // 移除
    (n1.children as VNode[]).forEach(i => {
      unmount(i)
    })
  } else {
    // TODO: diff
    ; (n1.children as VNode[]).forEach(vnode => {
      unmount(vnode)
    })
      ; (n2.children as VNode[]).forEach(vnode => {
        mount(container, vnode)
      })
  }
}

/**
 * patch html element
 */
function patchElement(n1: VNode, n2: VNode) {
  const el = n2.el = n1.el as HTMLElement
  // 处理 props
  patchProps(el, n1.props, n2.props)
  // 处理 children
  patchChildren(el, n1, n2)
}

/**
 * 处理文本节点的 patch
 * @param n1 老的 vnode
 * @param n2 新的 vnode
 */
function processText(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  const textContent = n2.children as string
  if (n1 === null) {
    // 新增
    n2.el = window.document.createTextNode(textContent)
    contianer.appendChild(n2.el)
  } else {
    // 内容更新
    n2.el = n1.el
      ; (n2.el as Text).textContent = textContent
  }
}

/**
 * 处理 Fragment
 */
function processFragment(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === null) {
    // 新增
    mountChildren(contianer, n2)
  } else {
    patchChildren(contianer, n1, n2)
  }
}

/**
 * 处理组件
 */
function processComponent(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === null) {
    mountComponent(contianer, n2)
  } else {
    // TODO: 更新组件
    
  }
}

/**
 * 处理 html 节点的的 patch
 * @param n1 老的 vnode
 * @param n2 新的 vnode
 */
function processElement(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === null) {
    // 新增
    mount(contianer, n2)
  } else {
    patchElement(n1, n2)
  }
}

/**
 * patch 两个 vnode，产生对实际 dom 的更新
 * @param n1 老的 vnode，可能没有，如果没有就是新增
 * @param n2 新的 vnode
 * @param contianer 挂载的 dom 容器
 * @returns 
 */
function patch(contianer: HTMLElement, n1: VNode | null, n2: VNode) {
  if (n1 === n2) return

  if (n1) {
    if (n1.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 组件卸载
      unmountComponent(n1)
      n1 = null
    } else if (!isSameVNode(n1, n2)) {
      unmount(n1)
      n1 = null
    }
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
  const _contianer = contianer as HTMLElement & { _vnode?: VNode }

  if (!vnode) {
    // 没有提供 vnode，即作为卸载操作
    // 如：render(null, contianer)
    unmount(_contianer._vnode)
  } else {

    // 传递旧 vnode 和 新 vnode 比对更新
    // normalize 将 vnode 规范化，包括子节点的处理
    patch(contianer, _contianer._vnode || null, normalize(vnode))

    // vnode 创建了之后记录在 dom 元素上，在下一次更新的时候，拿出来就行比对更新，即上面操作
    _contianer._vnode = vnode
  }

}
