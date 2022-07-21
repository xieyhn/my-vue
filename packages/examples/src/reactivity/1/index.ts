import { effect, reactive, ReactiveEffect } from 'vue'
// import { effect, reactive, computed } from 'my-vue'
const log = console.log.bind(console, '[x]')

// let dummy
// const obj = reactive<Record<string, number>>({})
// const fnSpy = () => {
//   log('fnSpy')
//   for (const key in obj) {
//     dummy = obj[key]
//   }
//   dummy = obj.prop
// }
// effect(fnSpy)

// // expect(fnSpy).toHaveBeenCalledTimes(1)
// // obj.prop = 16
// // log('dummy1', dummy)
// // expect(dummy).toBe(16)
// // expect(fnSpy).toHaveBeenCalledTimes(2)

const obj = []
const proxy = new Proxy(obj, {
  get(target, key, receiver) {
    log('get', key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    log('set', key, value)
    return Reflect.set(target, key, value, receiver)
  },
  has(target, key) {
    log('has')
    return Reflect.has(target, key)
  },
  ownKeys(target) {
    log('ownKeys', Reflect.ownKeys(target))
    return Reflect.ownKeys(target)
  },
})

proxy[2] = 1

// for(let key in proxy) {
//   log('key', key)
// }