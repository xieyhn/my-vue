// import { effect, reactive, ReactiveEffect, computed, ref, watch, watchEffect, render, h, createVNode, Fragment } from 'vue'
import { effect, reactive, computed, ref, watch, watchEffect, nextTick, render, createVNode, TextSymbol, FragmentSymbol, getCurrentInstance, onBeforeMount, onMounted, provide, inject, Teleport } from 'my-vue'
const log = console.log.bind(console, '[x]')

const contianer = document.querySelector('#app') as HTMLElement

const vnode1 = createVNode(Teleport, { to: '#root' }, [
  createVNode('h1', null, 'h1'),
  createVNode('h1', null, 'h1111'),
])

const vnode2 = createVNode(Teleport, { to: '#root2' }, [
  createVNode('h2', null, 'h2'),
  createVNode('h2', null, 'h2222'),
])

render(vnode1, contianer)
render(vnode2, contianer)
