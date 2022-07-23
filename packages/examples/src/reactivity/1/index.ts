// import { effect, reactive, ReactiveEffect, computed, ref, watch, watchEffect, render, h, createVNode } from 'vue'
import { effect, reactive, computed, ref, watch, watchEffect, nextTick, render, createVNode, TextSymbol, FragmentSymbol } from 'my-vue'
const log = console.log.bind(console, '[x]')

const contianer = document.querySelector('#app') as HTMLElement

const vnode1 = createVNode(
  FragmentSymbol,
  null,
  [
    createVNode('h1', null, 'h1'),
    createVNode('h2', null, 'h2'),
  ]
)

const vnode2 = createVNode(
  FragmentSymbol,
  null,
  [
    createVNode('h1', null, 'h1'),
    createVNode('h2', null, 'h3'),
  ]
)

render(vnode1, contianer)

setTimeout(() => {
  render(vnode2, contianer)
}, 1000);

// const obj = []
// const proxy = new Proxy(obj, {
//   get(target, key, receiver) {
//     log('get', key)
//     return Reflect.get(target, key, receiver)
//   },
//   set(target, key, value, receiver) {
//     log('set', key, value)
//     return Reflect.set(target, key, value, receiver)
//   },
//   has(target, key) {
//     log('has')
//     return Reflect.has(target, key)
//   },
//   ownKeys(target) {
//     log('ownKeys', Reflect.ownKeys(target))
//     return Reflect.ownKeys(target)
//   },
// })

// proxy[2] = 1

// for(let key in proxy) {
//   log('key', key)
// }