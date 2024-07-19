import { handlers } from "./handlers.render.js";

import { collapse_template_literal } from "../utils/collapse_template_literal.js";
import { escape_template } from "../utils/stringify.js";

export default class Renderer {
  has_bindings = false;
  name = undefined;
  stack = [];
  current = undefined; // TODO can it just be `current: string`?
  literal = undefined;
  targets = [];

  constructor({ name }) {
    this.name = name;
    this.push();
  }

  add_string(str) {
    this.current.value += escape_template(str);
  }

  add_expression(node) {
    this.literal.quasis.push({
      type: "TemplateElement",
      value: { raw: this.current.value, cooked: null },
      tail: false,
    });
    this.literal.expressions.push(node);
    this.current.value = "";
  }

  push() {
    const current = (this.current = { value: "" });
    const literal = (this.literal = {
      type: "TemplateLiteral",
      expressions: [],
      quasis: [],
    });
    this.stack.push({ current, literal });
  }

  pop() {
    this.literal.quasis.push({
      type: "TemplateElement",
      value: { raw: this.current.value, cooked: null },
      tail: true,
    });
    const popped = this.stack.pop();
    const last = this.stack[this.stack.length - 1];
    if (last) {
      this.literal = last.literal;
      this.current = last.current;
    }
    collapse_template_literal(popped.literal);
    return popped.literal;
  }

  render(nodes, options) {
    nodes.forEach((node) => {
      const handler = handlers[node.type];
      if (!handler) {
        throw new Error(`No handler for '${node.type}' nodes`);
      }
      handler(node, this, options);
    });
  }
}
