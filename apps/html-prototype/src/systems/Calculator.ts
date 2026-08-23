export type CalculatorResult = { display: string; value: number | null; error?: string };

export function formatCalculatorValue(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  const normalized = Object.is(value, -0) ? 0 : value;
  return String(Number(normalized.toPrecision(12)));
}

export function evaluateCalculator(input: string): CalculatorResult {
  const source = input.replace(/=/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  if (!source) return { display: "0", value: 0 };
  const tokens = tokenize(source);
  if (!tokens) return { display: "Error", value: null, error: "Invalid expression" };
  const values: Array<{ value: number; percentage: boolean }> = [];
  const operators: string[] = [];
  for (const token of tokens) {
    if (typeof token !== "string") values.push(token);
    else {
      while (operators.length && precedence(operators.at(-1)!) >= precedence(token)) {
        const result = reduce(values, operators.pop()!);
        if (!result) return { display: "Error", value: null, error: "Cannot divide by zero" };
      }
      operators.push(token);
    }
  }
  while (operators.length) {
    if (!reduce(values, operators.pop()!)) return { display: "Error", value: null, error: "Cannot divide by zero" };
  }
  const value = values.length === 1 && Number.isFinite(values[0].value) ? values[0].value : null;
  return value === null ? { display: "Error", value: null, error: "Invalid expression" } : { display: formatCalculatorValue(value), value };
}

export function applyCalculatorInput(display: string, key: string): string {
  if (key === "clear") return "0";
  if (key === "backspace") return display.length > 1 ? display.slice(0, -1) : "0";
  if (key === "equals" || key === "=" || key === "Enter") return evaluateCalculator(display).display;
  if (display === "Error" && (/[0-9.]/.test(key) || key === "-")) display = "0";
  if (key === "×" || key === "*") return `${display === "0" ? "" : display}*`;
  if (key === "÷" || key === "/") return `${display === "0" ? "" : display}/`;
  if (key === "." && /(?:^|[+\-*/])\d*\.\d*$/.test(display)) return display;
  return `${display === "0" && /[0-9.]/.test(key) ? "" : display}${key}`;
}

type NumberToken = { value: number; percentage: boolean };
type Token = NumberToken | string;

function tokenize(source: string): Token[] | null {
  const tokens: Token[] = [];
  let index = 0;
  let expectNumber = true;
  while (index < source.length) {
    const match = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(index));
    if (match) {
      const value = Number(match[0]);
      index += match[0].length;
      const percentage = source[index] === "%";
      if (percentage) index += 1;
      tokens.push({ value: percentage ? value / 100 : value, percentage });
      expectNumber = false;
      continue;
    }
    const operator = source[index];
    if ((operator === "-" || operator === "+") && expectNumber) {
      const signed = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(index + 1));
      if (!signed) return null;
      const value = Number(`${operator}${signed[0]}`);
      index += signed[0].length + 1;
      const percentage = source[index] === "%";
      if (percentage) index += 1;
      tokens.push({ value: percentage ? value / 100 : value, percentage });
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

function reduce(values: Array<{ value: number; percentage: boolean }>, operator: string): boolean {
  const right = values.pop();
  const left = values.pop();
  if (left === undefined || right === undefined) return false;
  const rightValue = right.percentage && (operator === "+" || operator === "-") ? left.value * right.value : right.value;
  if (operator === "/" && rightValue === 0) return false;
  const value = operator === "+" ? left.value + rightValue : operator === "-" ? left.value - rightValue : operator === "*" ? left.value * rightValue : left.value / rightValue;
  if (!Number.isFinite(value)) return false;
  values.push({ value, percentage: false });
  return true;
}
