abstract class HKT {
  readonly arg?: unknown
  fn!: (...x: never[]) => unknown
}

type Apply<F extends HKT, arg> = ReturnType<(F & { readonly arg: arg })["fn"]>

type Assume<T, U> = T extends U ? T : U

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

interface AppendInner<Suffix extends string> extends HKT {
  fn: (x: Assume<this["arg"], string>) => `${Suffix}${typeof x}`
}

interface Append extends HKT {
  fn: (x: Assume<this["arg"], string>) => AppendInner<typeof x>
}

interface Identity extends HKT {
  fn: (x: Assume<this["arg"], unknown>) => typeof x
}

interface Mockingbird extends HKT {
  fn: (x: Assume<this["arg"], HKT>) => Apply<typeof x, typeof x>
}

interface KestrelInner<A> extends HKT {
  fn: (x: Assume<this["arg"], any>) => A
}

interface Kestrel extends HKT {
  fn: (x: Assume<this["arg"], any>) => KestrelInner<typeof x>
}

interface Kite extends HKT {
  fn: (x: Assume<this["arg"], any>) => Apply<Apply<Kestrel, Identity>, typeof x>
}
