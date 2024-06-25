import AwaitBlock from "./handlers/AwaitBlock.js";
import Comment from "./handlers/Comment.js";
import DebugTag from "./handlers/DebugTag.js";
import EachBlock from "./handlers/EachBlock.js";
import Element from "./handlers/Element.js";
import Head from "./handlers/Head.js";
import HtmlTag from "./handlers/HtmlTag.js";
import IfBlock from "./handlers/IfBlock.js";
import InlineComponent from "./handlers/InlineComponent.js";
import KeyBlock from "./handlers/KeyBlock.js";
import Slot from "./handlers/Slot.js";
import SlotTemplate from "./handlers/SlotTemplate.js";
import Tag from "./handlers/Tag.js";
import Text from "./handlers/Text.js";
import Title from "./handlers/Title.js";
import { collapse_template_literal } from "../utils/collapse_template_literal.js";
import { escape_template } from "../utils/stringify.js";

function noop() {}

const handlers = {
  AwaitBlock,
  Body: noop,
  Comment,
  DebugTag,
  Document: noop,
  EachBlock,
  Element,
  Head,
  IfBlock,
  InlineComponent,
  KeyBlock,
  MustacheTag: Tag,
  Options: noop,
  RawMustacheTag: HtmlTag,
  Slot,
  SlotTemplate,
  Text,
  Title,
  Window: noop,
};

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
