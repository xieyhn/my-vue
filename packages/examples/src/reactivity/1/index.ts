// import { effect, reactive, ReactiveEffect, computed, ref } from 'vue'
import { effect, reactive, computed, ref } from 'my-vue'
const log = console.log.bind(console, '[x]')

const a = ref(1)
const obj = reactive({
  a,
  b: {
    c: a
  }
})

let dummy1: number
let dummy2: number

effect(() => {
  log('effect')
  dummy1 = obj.a
  dummy2 = obj.b.c
})

a.value++
log('add1', dummy1, dummy2)
obj.a++
log('add2', dummy1, dummy2)
// obj.b.c++
// assertDummiesEqualTo(4)




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