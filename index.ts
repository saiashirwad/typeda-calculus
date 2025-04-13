// lambda calculus parser

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

type TrimLeft<S extends string> =
  S extends `${" " | "\n" | "\t"}${infer Rest}` ? TrimLeft<Rest> : S

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

type PushStack<S extends State> = State<
  ConsumeChar<S, "(">,
  [],
  [...S["stack"], S["current"]]
>

type PopStack<S extends State> =
  S["stack"] extends (
    [...infer Stack extends Expr[][], infer Tail extends Expr[]]
  ) ?
    State<ConsumeChar<S, ")" | " ">, [...Tail, ...S["current"]], Stack>
  : never

type Parse<S extends State> =
  S["unscanned"] extends "" ? S["current"]
  : S["unscanned"] extends `(${string}` ? Parse<PushStack<S>>
  : S["unscanned"] extends `${")" | " "}${string}` ? Parse<PopStack<S>>
  : S["unscanned"] extends `${Lambda}${infer Rest}` ? [Lambda, Rest]
  : S
