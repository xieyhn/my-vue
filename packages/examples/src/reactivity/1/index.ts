// import { effect, reactive, ReactiveEffect, computed, ref, watch, watchEffect, render, h, createVNode, Fragment } from 'vue'
import { effect, reactive, computed, ref, watch, watchEffect, nextTick, render, createVNode, TextSymbol, FragmentSymbol, getCurrentInstance, onBeforeMount, onMounted } from 'my-vue'
const log = console.log.bind(console, '[x]')

const contianer = document.querySelector('#app') as HTMLElement

const myComponent = {
  setup(props, { emit, slots }) {

    onMounted(() => {
      console.log('onMounted')
    })

    return () => createVNode(FragmentSymbol, null, [slots.header()])
  }
}

const rootComponent = {
  setup() {
    return () => createVNode(myComponent, null, {
      header: () => createVNode('h1', null, 'header')
    })
  }
}

const vnode1 = createVNode(rootComponent)

render(vnode1, contianer)


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