import { effect, reactive } from 'vue'

const state = reactive({ name: 'zhangsan' })

effect(() => {
  console.log(state.name)
})

state.name = 'lisi'
