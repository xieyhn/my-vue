export const NOOP = () => {}

export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

export const isString = (val: unknown): val is string => typeof val === 'string'

export function isObject(val: unknown): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}

export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === '[object Object]'

export const isArray = Array.isArray

export function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}

export function isUndefined(val: unknown): val is undefined {
  return typeof val === 'undefined'
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

export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N

export const EMPTY_OBJ: { readonly [key: string]: any } = {}
