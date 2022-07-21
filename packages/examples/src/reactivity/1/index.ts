// import { effect, reactive } from 'vue'
import { effect, reactive, computed } from 'my-vue'

const state = reactive({ name: 'zhangsan', address: { t: 'address t' } })

effect(() => {
  console.log('[x]', state.address.t)
})

// state.address.t = 'wangwu'
// state.address = { a: 1 }
