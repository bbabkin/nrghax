// Central export for all types

export type * from './auth'

// Global utility types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type NonEmptyArray<T> = [T, ...T[]]