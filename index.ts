type Variable = { type: "var"; name: string }
type Abstraction = {
  type: "abstraction"
  variable: string
  body: Expr
}
type Application = {
  type: "application"
  operand: Expr
  argument: Expr
}
type Expr = Variable | Abstraction | Application

type Lambda = "λ"
type LParen = "("
type RParen = ")"
type Dot = "."
type Space = " "

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
  S extends `${" " | "\n" | "\t"}${infer Rest}` ?
    TrimLeft<Rest>
  : S

type ConsumeChar<
  S extends State,
  Ch extends string
> = TrimLeft<
  S["unscanned"] extends `${Ch}${infer Rest}` ? Rest
  : S["unscanned"]
>

type Consume<S extends State, Val extends string> = State<
  S["unscanned"] extends `${Val}${infer Rest}` ? Rest
  : S["unscanned"],
  S["current"],
  S["stack"]
>

type AccumulateStr<
  S extends string,
  Acc extends string = ""
> =
  S extends `${infer Ch}${infer Rest}` ?
    IsDelimiter<Ch> extends true ?
      [Acc, S]
    : AccumulateStr<Rest, `${Acc}${Ch}`>
  : [Acc, S]

type IsDelimiter<S extends string> =
  S extends Space | LParen | RParen ? true : false

type PushStack<S extends State> = State<
  ConsumeChar<S, LParen | Lambda>,
  [],
  [...S["stack"], S["current"]]
>

type AppendExpr<S extends State, E extends Expr> = [
  ...S["current"],
  E
]

type PopStack<S extends State> =
  S["stack"] extends (
    [
      ...infer Stack extends Expr[][],
      infer Tail extends Expr[]
    ]
  ) ?
    State<
      ConsumeChar<S, RParen | " ">,
      [
        ...Tail,
        // ... TODO
        ...S["current"]
      ],
      Stack
    >
  : never

type ShiftAbstractionVariable<S extends State> =
  S["unscanned"] extends `${Lambda}${infer Rest}` ?
    State<TrimLeft<Rest>, State["current"], State["stack"]>
  : never

type ShiftAbstractionBody<S extends State> =
  S["unscanned"] extends `.${infer Rest}` ?
    State<TrimLeft<Rest>, State["current"], State["stack"]>
  : never

type ShiftApplication<S extends State> =
  S["current"] extends [] ? never : S

type ShiftIdentifier<S extends State> =
  S["unscanned"] extends `${infer Char}${string}` ?
    IsDelimiter<Char> extends true ? S
    : AccumulateStr<S["unscanned"]> extends (
      [
        infer Str extends string,
        infer Remaining extends string
      ]
    ) ?
      State<
        TrimLeft<Remaining>,
        AppendExpr<S, { type: "var"; name: Str }>,
        S["stack"]
      >
    : S
  : S

type Parse<S extends State> =
  S["unscanned"] extends "" ? S
  : S["unscanned"] extends `${LParen | Lambda}${string}` ?
    Parse<PushStack<S>>
  : S["unscanned"] extends `${RParen}${string}` ?
    Parse<PopStack<S>>
  : S["unscanned"] extends `${Lambda}${string}` ?
    Parse<ShiftAbstractionVariable<S>>
  : S["unscanned"] extends `${Dot}${string}` ?
    Parse<ShiftAbstractionBody<S>>
  : S["unscanned"] extends `${Space}${string}` ?
    Parse<ShiftApplication<S>>
  : Parse<ShiftIdentifier<S>>

type result = Parse<InitialState<"(λa.a) b">>
