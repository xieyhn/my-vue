import { effect, reactive, ReactiveEffect, computed } from 'vue'
// import { effect, reactive, computed } from 'my-vue'
const log = console.log.bind(console, '[x]')

let plusOneValues: number[] = []
const n = reactive({ value: 0 })
const plusOne = computed(() => n.value + 1)
effect(() => {
  n.value
  plusOneValues.push(plusOne.value)
})
plusOne.value
n.value++
log('plusOneValues', plusOneValues)
// expect(plusOneValues).toMatchObject([1, 2, 2])

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