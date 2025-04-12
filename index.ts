type GenericFunction = (...x: never[]) => unknown

abstract class HKT {
  readonly _1?: unknown
  new!: GenericFunction
}

type Assume<T, U> = T extends U ? T : U

type Apply<F extends HKT, _1> = ReturnType<
  (F & {
    readonly _1: _1
  })["new"]
>

type Compose<HKTs extends HKT[], X> =
  HKTs extends [] ? X
  : HKTs extends [infer Head, ...infer Tail] ?
    Apply<Assume<Head, HKT>, Compose<Assume<Tail, HKT[]>, X>>
  : never

type Reverse<T extends unknown[]> =
  T extends [] ? []
  : T extends [infer U, ...infer Rest] ? [...Reverse<Rest>, U]
  : never

interface Flow<HKTs extends HKT[]> extends HKT {
  new: (x: this["_1"]) => Compose<Reverse<HKTs>, this["_1"]>
}

interface DoubleString extends HKT {
  new: (x: Assume<this["_1"], string>) => `${typeof x}${typeof x}`
}

interface Append<S extends string> extends HKT {
  new: (x: Assume<this["_1"], string>) => `${typeof x}${S}`
}

type asdf = Apply<DoubleString, "asdf">
