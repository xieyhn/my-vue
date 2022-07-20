export function isObject(val: unknown) {
  return val !== null && typeof val === 'object'
}

export function isArray(val: unknown) {
  return Array.isArray(val)
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val => {
  return hasOwnProperty.call(val, key)
}
