export const NOOP = () => {}

export const isString = (val: unknown): val is string => typeof val === 'string'

export function isObject(val: unknown) {
  return val !== null && typeof val === 'object'
}

export function isArray(val: unknown) {
  return Array.isArray(val)
}

export function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val => {
  return hasOwnProperty.call(val, key)
}

export const isIntegerKey = (key: unknown) =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)