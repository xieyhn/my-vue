// import { effect, reactive } from 'vue'
import { effect, reactive } from 'my-vue'

const state = reactive({ flag: true, name: 'zhangsan', age: 13 })

effect(() => {
  console.log(state.flag ? state.name : state.age)
})

// state.name = 'lisi'
state.flag = false
state.age = 15
