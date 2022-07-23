// import { effect, reactive, ReactiveEffect, computed, ref, watch, watchEffect } from 'vue'
import { effect, reactive, computed, ref, watch, watchEffect, nextTick } from 'my-vue'
const log = console.log.bind(console, '[x]')

async function main() {
  const src = reactive({
    count: 0
  })
  let dummy
  watch(src, ({ count }) => {
    log(count)
    dummy = count
  })
  src.count++
  await nextTick()
  log('dummy1', dummy)
}

main()



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