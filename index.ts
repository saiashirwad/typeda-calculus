type GenericFunction = (...x: never[]) => unknown

abstract class HKT {
  readonly arg?: unknown
  fn!: GenericFunction
}

type Assume<T, U> = T extends U ? T : U

type Apply<F extends HKT, arg> = ReturnType<(F & { readonly arg: arg })["fn"]>

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
  fn: (x: this["arg"]) => Compose<Reverse<HKTs>, this["arg"]>
}

interface DoubleString extends HKT {
  fn: (x: Assume<this["arg"], string>) => `${typeof x}${typeof x}`
}

interface Append<S extends string> extends HKT {
  fn: (x: Assume<this["arg"], string>) => `${typeof x}${S}`
}

type asdf = Apply<DoubleString, "asdf">

type appendedResult = Apply<Append<"hi  ">, asdf>

type composedResult = Apply<Flow<[DoubleString, Append<"hi  ">]>, "asdf">
