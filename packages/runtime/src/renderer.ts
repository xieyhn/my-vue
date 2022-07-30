import { ReactiveEffect } from "@my-vue/reactivity";
import { isArray, isObject, isString, ShapeFlags } from "@my-vue/shared";
import { ComponentInternalInstance, createComponentInstance, setupComponent } from "./component";
import { callLifeCycleHook, LifeCycleHooks } from "./componentLifeCycle";
import { hasPropsChanged, updateProps, updateSlots } from "./componentProps";
import { Teleport } from "./components/Teleport";
import { patchProp } from "./patchProp";
import { queueJob } from "./scheduler";
import { TextSymbol, VNode, isSameVNode, normalize, FragmentSymbol, ArrayChildren, ObjectChildren } from "./vnode";

/**
 * mount
 * 将 vnode 挂载到指定容器
 */
function mount(
  vnode: VNode,
  contianer: HTMLElement,
  anchor: ChildNode | null,
  parentComponent?: ComponentInternalInstance
) {
  if (isString(vnode.type)) {
    mountElement(vnode, contianer, anchor)
  } else if (vnode.type === TextSymbol) {
    mountTextNode(vnode, contianer, anchor)
  } else if (vnode.type === FragmentSymbol) {
    mountFragment(vnode, contianer, anchor)
  } else if (isObject(vnode.type)) {
    mountComponent(vnode, contianer, anchor, parentComponent)
  }
}

/**
 * 挂载元素
 */
function mountElement(vnode: VNode, contianer: HTMLElement, anchor: ChildNode | null) {
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
    mountChildren(vnode.children as any[], vnode.el, anchor)
  }

  contianer.insertBefore(el, anchor)
}

/**
 * 挂载文本节点
 */
function mountTextNode(vnode: VNode, contianer: HTMLElement, anchor: ChildNode | null) {
  const n = window.document.createTextNode(vnode.children as string)
  vnode.el = n
  contianer.insertBefore(n, anchor)
}

/**
 * 挂载 Fragment
 */
function mountFragment(vnode: VNode, contianer: HTMLElement, anchor: ChildNode | null) {
  const n = window.document.createTextNode('')
  vnode.el = n
  contianer.insertBefore(n, anchor)
  mountChildren(vnode.children as ArrayChildren, vnode.el!.parentElement!, anchor)
}

/**
 * 挂载组件
 */
function mountComponent(vnode: VNode, container: HTMLElement, anchor: ChildNode | null, parentComponent?: ComponentInternalInstance) {
  const instance = createComponentInstance(vnode, parentComponent)
  setupComponent(instance)
  setupRenderEffect(container, anchor, instance)
}

/**
 * mountChildren
 * 挂载 vnode 的 children
 */
export function mountChildren(
  children: ArrayChildren,
  container: HTMLElement,
  anchor: ChildNode | null,
  parentComponent?: ComponentInternalInstance
) {
  for(let i = 0; i < children.length; i++) {
    normalize(children, i)

    mount(children[i] as VNode, container, anchor, parentComponent)
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
    // 更新实例上的 props 和 slots，接着走 render
    // 一定需要在源对象上修改，应该原对象已以 context 传递给 setup 方法，直接替换会导致丢掉引用
    updateProps(instance.props!, next.props as any || {})
    updateSlots(instance.slots!, next.children as ObjectChildren)
  }
}

/**
 * 组件 effect
 */
function setupRenderEffect(container: HTMLElement, anchor: ChildNode | null, instance: ComponentInternalInstance) {
  const componentUpdate = () => {
    // normalize!!!
    if (!instance.isMounted) {
      callLifeCycleHook(instance, LifeCycleHooks.BEFORE_MOUNT)
      instance.subTree = instance.render!.call(instance.proxy!)
      mount(instance.subTree, container, anchor, instance)
      instance.isMounted = true
      callLifeCycleHook(instance, LifeCycleHooks.MOUNTED)
    } else {
      updateComponentPreRender(instance)

      const newSubTree = instance.render!.call(instance.proxy!)
      patch(instance.subTree!, newSubTree, container, anchor, instance)
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
 * 全量比对
 */
function patchKeyedChildren(c1: VNode[], c2: VNode[], container: HTMLElement) {
  let i = 0
  let e1 = c1.length - 1
  let e2 = c2.length - 1

  // 从头开始处理，遇到相同元素直接 patch
  // sync from start
  while(i <= e1 && i <= e2) {
    if (!isSameVNode(c1[i], c2[i])) break
    patch(c1[i], c2[i], container, null)
    i++
  }
  // 从尾部开始处理，遇到相同元素直接 patch
  // sync from end
  while(i <= e1 && i <= e2) {
    if (!isSameVNode(c1[e1], c2[e2])) break
    patch(c1[e1], c2[e2], container, null)
    e1--
    e2--
  }

  // 经过上述头尾分别比较后，在 (旧 i 至 e1) 和 (新 i 至 e2) 之间的两个数组就是头尾不相同的元素列表
  // 进而缩小的比对范围

  // 同序列挂载（头尾处理完成后，只出现了简单的新增或需要删除的情况）
  // common sequence + mount
  // 若 i 比 e1 大，且小于等于 e2，即新数组中有新增的元素（[i, e2] 就是新增的部分）
  if (i > e1 && i <= e2) {
    // 根据 e2 在 c2 中的下一位来获取插入锚点，如没有，就是从尾部添加，如有，就是从头部添加（可以根据画图得到这个结论）
    const anchor = c2[e2 + 1]?.el || null
    for(; i <= e2; i++) {
      mount(c2[i], container, anchor)
    }
    return
  } 
  // 若 i 小于等于 e1，且比 e2 大，即旧数组中有需要卸载的元素（[i, e1] 就是需要卸载的部分）
  if (i <= e1 && i > e2) {
    for(; i <= e1; i++) {
      unmount(c1[i])
    }
    return
  }
  
  // 如不满足同序列挂载即剩余元素**乱序比对**
  let s1 = i
  let s2 = i

  // 记录剩余数组（新）的 key 和在新数组中的 索引关系 （vnode.key => index）
  const keyToNewIndexMap = new Map()
  for(let j = s2; j <= e2; j++) keyToNewIndexMap.set(c2[j].key, j)

  // 在旧节点中找新节点，找不到就卸载，找到了就行比对（不关注顺序）

  // 需要遍历的个数（也就是排除了头尾的新数组）
  const toBePatched = e2 - s2 + 1

  // 用于记录被 patch 过的新节点在老节点中的索引，用于知道哪个节点是存在过的，若不存在即就是默认的 -1，存在就是具体的索引值
  //（这个数组是排除过头尾的）
  const newIndexToOldIndexMap = new Array(toBePatched).fill(-1)

  for(let j = s1; j <= e1; j++) {
    const oldChild = c1[j]
    const newIndex = keyToNewIndexMap.get(oldChild.key)
    if (newIndex === undefined) {
      // 新的不存在这个节点了，即需要删除
      unmount(oldChild)
    } else {
      // 否则进行比对
      patch(oldChild, c2[newIndex], container, null)

      // 这个数组是排除过头尾的，因此大小需要注意，key 需要减去头部值
      newIndexToOldIndexMap[newIndex - s2] = j
    }
  }

  // 再次优化，找出需要移动的节点：
  // 获取在老节点中的递增的序列，这样这些元素可以不用移动（因为他们保持者顺序），只需要移动不存在此结果中的索引
  const increment = getSequence(newIndexToOldIndexMap)

  // 为方便找出插入锚点，即自己后面的元素，这里需要采用倒序遍历
  let k = increment.length - 1
  for(let j = e2; j >= s2; j--) {
    const anchor = c2[j + 1]?.el || null
    if (newIndexToOldIndexMap[j - s2] === -1) {
      mount(c2[j], container, anchor)
      continue
    }
    if (j - s2 === increment[k]) {
      // 在 increment 中即不需要移动
      k--
    } else {
      container.insertBefore(c2[j].el!, anchor)
    }
  }
}

/**
 * 比对元素的子节点
 */
export function patchChildren(n1: VNode, n2: VNode, container: HTMLElement, anchor: ChildNode | null) {
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
      patchKeyedChildren(c1!, c2, n1.el as HTMLElement)
    } else if (n1.shapeFlag * ShapeFlags.TEXT_CHILDREN) {
      container.textContent = ''
      mountChildren(n2.children as any, n1.el as HTMLElement, anchor)
    }
  }
}

/**
 * 处理文本节点的 patch
 * @param n1 老的 vnode
 * @param n2 新的 vnode
 */
function processText(n1: VNode | null, n2: VNode, contianer: HTMLElement, anchor: ChildNode | null) {
  const textContent = n2.children as string
  if (n1 === null) {
    mount(n2, contianer, anchor)
  } else {
    // 内容更新
    n2.el = n1.el
    ;(n2.el as Text).textContent = textContent
  }
}

/**
 * 处理 Fragment
 */
function processFragment(n1: VNode | null, n2: VNode, contianer: HTMLElement, anchor: ChildNode | null) {
  if (n1 === null) {
    // 新增
    mount(n2, contianer, anchor)
  } else {
    n2.el = n1.el
    // 子节点更新
    patchChildren(n1, n2, contianer, anchor)
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
function processComponent(n1: VNode | null, n2: VNode, contianer: HTMLElement, anchor: ChildNode | null, parentComponent?: ComponentInternalInstance) {
  if (n1 === null) {
    mount(n2, contianer, anchor, parentComponent)
  } else {
    updateComponent(n1, n2)
  }
}

/**
 * processElement 更新逻辑
 */
function patchElement(n1: VNode, n2: VNode, anchor: ChildNode | null) {
  const el = n2.el = n1.el as HTMLElement
  // 处理 props
  patchProps(el, n1.props, n2.props)
  // 处理 children
  patchChildren(n1, n2, el, anchor)
}

/**
 * 处理 html 节点的的 patch
 */
function processElement(n1: VNode | null, n2: VNode, contianer: HTMLElement, anchor: ChildNode | null) {
  if (n1 === null) {
    mount(n2, contianer, anchor)
  } else {
    patchElement(n1, n2, anchor)
  }
}

/**
 * patch 两个 vnode，产生对实际 dom 的更新
 */
export function patch(n1: VNode | null, n2: VNode, contianer: HTMLElement, anchor: ChildNode | null, parentComponent?: ComponentInternalInstance) {
  if (n1 === n2) return

  if (n1 && !isSameVNode(n1, n2)) {
    // 不是同一个节点将之前的节点卸载
    unmount(n1)
    n1 = null
  }

  switch (n2.type) {
    case TextSymbol:
      // 这是一个文本节点
      processText(n1, n2, contianer, anchor)
      break
    case FragmentSymbol:
      processFragment(n1, n2, contianer, anchor)
      break;
    default:
      if (n2.shapeFlag & ShapeFlags.TELEPORT) {
        (n2.type as typeof Teleport).process(n1, n2)
      } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(n1, n2, contianer, anchor, parentComponent)
      } else {
        // 是一个 HTML 元素的 vnode
        processElement(n1, n2, contianer, anchor)
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
    patch(root._vnode || null, vnode, contianer, null)
    root._vnode = vnode
  }
}

// 获取数组中最长递增的字序列索引组成的数组（非连续）
// 原理：
// 遍历过程中，如比最后一位数大，直接添加，否则使用二分查找出左数第一个比自己大的元素，替换（贪心算法）
function getSequence(arr: number[]) {
  // 记录的是索引值，并非数组中的值
  const result: number[] = []
  // 记录当前索引的前一个节点的索引，最后进行追溯生成正确的序列
  const p = new Array(arr.length)

  for(let i = 0; i < arr.length; i++) {
    const lastIndex = result.length - 1

    if (result[lastIndex] === undefined || arr[i] > arr[result[lastIndex]]) {
      p[i] = result[lastIndex]
      result.push(i)
      continue
    }

    // 二分查找，找出从头数，第一个比 arr[i] 大的元素，并替换
    let start = 0
    let end = lastIndex
    let middle: number
    while(start < end) {
      middle = Math.floor((start + end) / 2)
      if (arr[result[middle]] <= arr[i]) {
        start = middle + 1
      } else {
        end = middle
      }
    }
    if (arr[result[end]] > arr[i]) {
      p[i] = p[result[end]]
      result[end] = i
    }
  }

  // 贪心算法后，只保证了节点数量的正确，没有保证结果正确，最后需要使用记录的关系，追回原来的正确的递增序列
  for(let i = result.length - 2; i >= 0; i--) {
    result[i] = p[result[i + 1]]
  }

  return result
}

