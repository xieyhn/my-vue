import { isArray } from "@my-vue/shared"

export interface SchedulerJob extends Function {}

export type SchedulerJobs = SchedulerJob | SchedulerJob[]

// 标记是否正在执行队列中的回调
let isFlushing = false
// 标记是否准备执行还没执行队列，即调用了 Promise.then 但还没走到这个微任务时，值为 true
let isFlushPending = false

// 当前事件循环还未执行的回调数组
const pendingPreFlushCbs: SchedulerJob[] = []
// 当前事件循环正在执行的回调数组，开始执行时，会将 pendingPreFlushCbs 值拿过来依次执行并重置 pendingPreFlushCbs
let activePreFlushCbs: SchedulerJob[] | null = null

// 与上述的 pre 行为一致
const pendingPostFlushCbs: SchedulerJob[] = []
let activePostFlushCbs: SchedulerJob[] | null = null

const resolvedPromise = Promise.resolve() as Promise<any>
let currentFlushPromise: Promise<void> | null = null

export function nextTick<T = void>(this: T, fn?: (this: T) => void) {
  // 会在所有的 effect 执行完成后执行
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(this ? fn.bind(this) : fn) : p
}

function queueCb(cb: SchedulerJobs, activeQueue: SchedulerJob[] | null, pendingQueue: SchedulerJob[]) {
  if (isArray(cb)) {
    // if cb is an array, it is a component lifecycle hook which can only be
    // triggered by a job, which is already deduped in the main queue, so
    // we can skip duplicate check here to improve perf
    pendingQueue.push(...cb)
  } else {
    // 正在执行的队列中有这个回调，就不再添加了（上面数组情况不需要判断的见注释）
    if (!activeQueue || !activeQueue.includes(cb)) {
      pendingQueue.push(cb)
    }
  }

  queueFlush()
}

export function queuePreFlushCb(cb: SchedulerJob) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs)
}

export function queuePostFlushCb(cb: SchedulerJobs) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs)
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    // 准备开始执行，正在等待下面的微任务执行
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}


function flushJobs() {
  isFlushPending = false
  isFlushing = true

  // 执行 pre
  flushPreFlushCbs()

  // 这里会执行 render 等，先省略逻辑

  // 执行 post
  flushPostFlushCbs()

  isFlushing = false

  // 在 post 执行完成后，可能继续生成 pre、post cb，这里继续执行
  // 也就是在同一个事件循环中产生的任务会一直执行完成
  if (pendingPreFlushCbs.length || pendingPostFlushCbs.length) {
    flushJobs()
  }
}

function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length === 0) return

  // 去重
  activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
  pendingPreFlushCbs.length = 0

  activePreFlushCbs.forEach(cb => cb())
  activePreFlushCbs = null

  // 在执行的过程中，可能会再次生成 pre cb，继续执行
  flushPreFlushCbs()
}

export function flushPostFlushCbs() {
  if (pendingPostFlushCbs.length === 0) return

  // 去重
  activePostFlushCbs = [...new Set(pendingPostFlushCbs)]
  pendingPostFlushCbs.length = 0

  activePostFlushCbs.forEach(cb => cb())
  activePostFlushCbs = null
}
