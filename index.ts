type Variable = ["var", string]
type Abstraction = ["abstraction", string, Expr]
type Application = ["application", Expr, Expr]
type Expr = Variable | Abstraction | Application

type Lambda = "λ"

// <expression> ::= <variable>                  -- A variable is an expression
//               | 'λ' <variable> '.' <expression> -- An abstraction (lambda)
//               | <expression> <expression>     -- An application
//               | '(' <expression> ')'          -- Parentheses for grouping/precedence
// <variable>   ::= <identifier>                -- e.g., a sequence of letters

type State<
  unscanned extends string = any,
  current extends Expr[] = Expr[],
  stack extends Expr[][] = Expr[][]
> = { unscanned: unscanned; current: current; stack: stack }

type InitialState<T extends string> = State<T, [], []>

type TrimLeft<S extends string> = S extends `${" " | "\n" | "\t"}${infer Rest}` ? TrimLeft<Rest> : S

type ConsumeChar<S extends State, Ch extends string> = TrimLeft<
  S["unscanned"] extends `${Ch}${infer Rest}` ? Rest : S["unscanned"]
>

type ShiftVariable<S extends State> =
  S["unscanned"] extends `${infer Ch}${infer Rest}` ?
    State<TrimLeft<Rest>, [...S["current"], [type: "var", value: Ch]]>
  : S

type AccumulateStr<S extends string, Acc extends string = ""> =
  S extends `${infer Ch}${infer Rest}` ?
    IsDelimiter<Ch> extends true ?
      [Acc, S]
    : AccumulateStr<Rest, `${Acc}${Ch}`>
  : [Acc, S]

type IsDelimiter<S extends string> = S extends " " | "(" | ")" ? true : false

type PushStack<S extends State> = State<ConsumeChar<S, "(">, [], [...S["stack"], S["current"]]>

type AppendExpr<S extends State, Type extends Expr[0], Value extends any[]> = [
  ...S["current"],
  [Type, ...Value]
]

type PopStack<S extends State> =
  S["stack"] extends [...infer Stack extends Expr[][], infer Tail extends Expr[]] ?
    State<
      ConsumeChar<S, ")" | " ">,
      [
        ...Tail,
        // ... TODO
        ...S["current"]
      ],
      Stack
    >
  : never

type ShiftAbstraction<S extends State> = S

type ShiftIdentifier<S extends State> =
  S["unscanned"] extends `${infer Char}${string}` ?
    IsDelimiter<Char> extends true ? S
    : AccumulateStr<S["unscanned"]> extends (
      [infer Str extends string, infer Remaining extends string]
    ) ?
      State<TrimLeft<Remaining>, AppendExpr<S, "var", [Str]>, S["stack"]>
    : S
  : S

type Parse<S extends State> =
  S["unscanned"] extends "" ? S["current"]
  : S["unscanned"] extends `(${string}` ? Parse<PushStack<S>>
  : S["unscanned"] extends `${")" | " "}${string}` ? Parse<PopStack<S>>
  : S["unscanned"] extends `${Lambda}${string}` ? Parse<ShiftAbstraction<S>>
  : Parse<ShiftIdentifier<S>>

// type result = Parse<InitialState<" λ">>
