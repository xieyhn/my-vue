// import { effect, reactive } from 'vue'
import { effect, reactive } from 'my-vue'

const arr = reactive([] as number[])

effect(() => {
  arr.push(1)
})

effect(() => {
  arr.push(3)
})

console.log(arr)