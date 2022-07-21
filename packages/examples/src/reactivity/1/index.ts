// import { effect, reactive, ReactiveEffect, computed } from 'vue'
import { effect, reactive, computed } from 'my-vue'
const log = console.log.bind(console, '[x]')

debugger
const value = reactive<{ foo?: number }>({})
const cValue = computed(() => value.foo)
let dummy;
debugger
effect(() => {
  dummy = cValue.value
})

// log('dummy1', dummy)
// expect(dummy).toBe(undefined)
value.foo = 1
// log('dummy2', cValue.value, dummy)
// expect(dummy).toBe(1)

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