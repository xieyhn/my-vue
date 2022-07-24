import { reactive } from '@my-vue/reactivity';
import { hasOwn } from '@my-vue/shared';
import { ComponentInternalInstance } from './component';
import { VNode } from './vnode';

type Data = Record<string, any>

export function initProps(instance: ComponentInternalInstance) {
  const { vnode } = instance
  const rawProps = (vnode.props && vnode.props.props) as Data | undefined
  if (!rawProps) return

  const props: Record<string, any> = {}
  const attrs: Record<string, any> = {}

  for(let key in rawProps) {
    if (hasOwn(instance.propsOptions, key)) {
      props[key] = rawProps[key]
    } else {
      attrs[key] = rawProps[key]
    }
  }

  // 应该是 shallowReactive
  instance.props = reactive(props)
  instance.attrs = attrs
}

export function hasPropsChanged(preProps: Data, nextProps: Data) {
  if (Object.keys(nextProps).length !== Object.keys(nextProps).length) {
    return true
  }

  for(let key in nextProps) {
    if (nextProps[key] !== preProps[key]) {
      return true
    }
  }

  return false
}

export function updateProps(preProps: Data, nextProps: Data) {
  for(let key in nextProps) {
    preProps[key] = nextProps[key]
  }
  for(let key in preProps) {
    if (!(key in nextProps)) {
      delete preProps[key]
    }
  }
}
