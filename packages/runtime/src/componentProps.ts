import { reactive } from '@my-vue/reactivity';
import { hasOwn } from '@my-vue/shared';
import { ComponentInstance } from './component';

export function initProps(instance: ComponentInstance, rawProps: Record<string, any> | null) {
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
