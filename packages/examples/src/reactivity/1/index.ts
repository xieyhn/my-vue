// import { effect, reactive, ReactiveEffect, computed, ref, watch, watchEffect, render, h, createVNode, Fragment } from 'vue'
import { effect, reactive, computed, ref, watch, watchEffect, nextTick, render, createVNode, TextSymbol, FragmentSymbol, getCurrentInstance, onBeforeMount, onMounted, provide, inject, Teleport } from 'my-vue'
const contianer = document.querySelector('#app') as HTMLElement

const vnode1 = createVNode(Teleport, { to: '#root' }, [
  createVNode('h1', null, 'h1'),
  createVNode('h1', null, 'h1111'),
])

const vnode2 = createVNode(TextSymbol, null, '你好啊')

render(vnode1, contianer)

setTimeout(() => {
  render(vnode2, contianer)
}, 1000);
