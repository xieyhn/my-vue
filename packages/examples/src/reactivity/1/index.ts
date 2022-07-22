// import { effect, reactive, ReactiveEffect, computed, ref } from 'vue'
import { effect, reactive, computed, ref } from 'my-vue'
const log = console.log.bind(console, '[x]')

const array = reactive([1])
let length = ''
effect(() => {
  length = ''
  for (const key in array) {
    length += key
  }
})

log('length', length)
// expect(length).toBe('0')
array.push(1)
log('length', length)
// expect(length).toBe('01')



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