// import { effect, reactive, ReactiveEffect, computed, ref, watch } from 'vue'
import { effect, reactive, computed, ref, watch } from 'my-vue'
const log = console.log.bind(console, '[x]')

const state = reactive({ a: 1 })

watch(state, (oldValue, newValue, onCleanup) => {
  onCleanup(() => {
    console.log('onCleanup')
  })
  console.log(oldValue, newValue)
}, {
  flush: 'sync'
})

state.a = 2
state.a = 3


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