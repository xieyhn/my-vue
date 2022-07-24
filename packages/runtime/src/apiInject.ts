import { isUndefined } from "@my-vue/shared";
import { getCurrentInstance } from "./component";

export function provide(key: string, value: any) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    currentInstance.provides[key] = value
  }
}

export function inject(key: string, defaultValue?: any) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const value = currentInstance.provides[key]
    return isUndefined(value) ? defaultValue : value
  }
  return undefined
}
