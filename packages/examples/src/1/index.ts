// import { effect, reactive, ReactiveEffect, computed, ref, watch, watchEffect, render, h, createVNode, Fragment } from 'vue'
import { effect, reactive, computed, ref, watch, watchEffect, nextTick, render, createVNode, TextSymbol, FragmentSymbol, getCurrentInstance, onBeforeMount, onMounted, provide, inject, Teleport, onUpdated, KeepAlive } from 'my-vue'
const contianer = document.querySelector('#app') as HTMLElement

const Comp = {
  name: 'comp1',
  setup() {
    onMounted(() => {
      console.log('onMounted', 'comp1')
    })

    return () => createVNode('p', null, 'pppp')
  }
}

const Comp2 = {
  name: 'comp2',
  setup() {
    onMounted(() => {
      console.log('onMounted', 'comp2')
    })

    return () => createVNode('p', null, 'pppp2222')
  }
}

const vnode1 = createVNode(
  KeepAlive,
  null,
  {
    default: () => createVNode(Comp, null, [])
  }
)

const vnode2 = createVNode(
  KeepAlive,
  null,
  {
    default: () => createVNode(Comp2, null, [])
  }
)

render(vnode1, contianer)

setTimeout(() => {
  render(vnode2, contianer)

  setTimeout(() => {
    render(vnode1, contianer)
  }, 1000);
}, 1000);

