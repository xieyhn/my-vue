// import { effect, reactive } from 'vue'
import { effect, reactive, computed } from 'my-vue'

const state = reactive({ name: 'zhangsan' })

const c = computed(() => {
  console.log('computed')
  return state.name + 'haha'
})

effect(() => {
  console.log(c.value)
  console.log(c.value)
})

setTimeout(() => {
  state.name = 'lishi'
}, 1000);
