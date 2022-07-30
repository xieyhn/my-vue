// import { effect, reactive, ReactiveEffect, computed, ref, watch, watchEffect, render, h, createVNode, Fragment } from 'vue'
import { effect, reactive, computed, ref, watch, watchEffect, nextTick, render, createVNode, TextSymbol, FragmentSymbol, getCurrentInstance, onBeforeMount, onMounted, provide, inject, Teleport } from 'my-vue'
const contianer = document.querySelector('#app') as HTMLElement

const vnode1 = createVNode('div', null, [
  createVNode('p', { key: 'a' }, 'a'),
  createVNode('p', { key: 'b' }, 'b'),
  createVNode('p', { key: 'c' }, 'c'),
  createVNode('p', { key: 'd' }, 'd'),
  createVNode('p', { key: 'e' }, 'e'),
  createVNode('p', { key: 'f' }, 'f'),
  createVNode('p', { key: 'g' }, 'g'),

  // 同序列挂载
  // createVNode('p', { key: 'a' }, 'a'),
  // createVNode('p', { key: 'b' }, 'b'),
  // createVNode('p', { key: 'c' }, 'c'),
])

const vnode2 = createVNode('div', null, [
  createVNode('p', { key: 'a' }, 'a'),
  createVNode('p', { key: 'b' }, 'b'),
  createVNode('p', { key: 'e' }, 'e'),
  createVNode('p', { key: 'c' }, 'c'),
  createVNode('p', { key: 'd' }, 'd'),
  createVNode('p', { key: 'h' }, 'h'),
  createVNode('p', { key: 'f' }, 'f'),
  createVNode('p', { key: 'g' }, 'g'),

  // 同序列挂载
  // createVNode('p', { key: 'e' }, 'e'),
  // createVNode('p', { key: 'd' }, 'd'),
  // createVNode('p', { key: 'a' }, 'a'),
  // createVNode('p', { key: 'b' }, 'b'),
  // createVNode('p', { key: 'c' }, 'c'),
  
])

render(vnode1, contianer)

setTimeout(() => {
  render(vnode2, contianer)
}, 1000);
