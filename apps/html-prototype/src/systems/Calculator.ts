export type CalculatorResult = { display: string; value: number | null; error?: string };

export function evaluateCalculator(input: string): CalculatorResult {
  const source = input.replace(/=/g, "").replace(/\s+/g, "");
  if (!source) return { display: "0", value: 0 };
  const tokens = tokenize(source);
  if (!tokens) return { display: source, value: null, error: "Invalid expression" };
  const values: number[] = [];
  const operators: string[] = [];
  for (const token of tokens) {
    if (typeof token === "number") values.push(token);
    else {
      while (operators.length && precedence(operators.at(-1)!) >= precedence(token)) {
        if (!reduce(values, operators.pop()!)) return { display: source, value: null, error: "Cannot divide by zero" };
      }
      operators.push(token);
    }
  }
  while (operators.length) {
    if (!reduce(values, operators.pop()!)) return { display: source, value: null, error: "Cannot divide by zero" };
  }
  const value = values.length === 1 && Number.isFinite(values[0]) ? values[0] : null;
  return value === null ? { display: source, value: null, error: "Invalid expression" } : { display: String(value), value };
}

export function applyCalculatorInput(display: string, key: string): string {
  if (key === "clear") return "0";
  if (key === "backspace") return display.length > 1 ? display.slice(0, -1) : "0";
  if (key === "equals") return evaluateCalculator(display).display;
  if (key === "×") return `${display === "0" ? "" : display}*`;
  if (key === "÷") return `${display === "0" ? "" : display}/`;
  return `${display === "0" && /[0-9.]/.test(key) ? "" : display}${key}`;
}

type Token = number | string;

function tokenize(source: string): Token[] | null {
  const tokens: Token[] = [];
  let index = 0;
  let expectNumber = true;
  while (index < source.length) {
    const match = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(index));
    if (match) {
      const number = Number(match[0]);
      index += match[0].length;
      if (source[index] === "%") {
        tokens.push(number / 100);
        index += 1;
      } else tokens.push(number);
      expectNumber = false;
      continue;
    }
    const operator = source[index];
    if ((operator === "-" || operator === "+") && expectNumber) {
      const signed = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(index + 1));
      if (!signed) return null;
      const number = Number(`${operator}${signed[0]}`);
      index += signed[0].length + 1;
      tokens.push(number);
      expectNumber = false;
      continue;
    }
    if ("+-*/".includes(operator) && !expectNumber) {
      tokens.push(operator);
      index += 1;
      expectNumber = true;
      continue;
    }
    return null;
  }
  return expectNumber ? null : tokens;
}

function precedence(operator: string): number {
  return operator === "*" || operator === "/" ? 2 : 1;
}

function reduce(values: number[], operator: string): boolean {
  const right = values.pop();
  const left = values.pop();
  if (left === undefined || right === undefined) return false;
  if (operator === "/" && right === 0) return false;
  values.push(operator === "+" ? left + right : operator === "-" ? left - right : operator === "*" ? left * right : left / right);
  return true;
}
