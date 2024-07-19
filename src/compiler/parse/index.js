import { isIdentifierStart, isIdentifierChar } from "acorn";
import fragment from "./state/fragment.js";
import { regex_whitespace } from "../utils/patterns.js";
import { reserved } from "../utils/names.js";
import full_char_code_at from "../utils/full_char_code_at.js";
import error from "../utils/error.js";
import parser_errors from "./errors.js";
const regex_position_indicator = / \(\d+:\d+\)$/;

export class Parser {
  template = undefined;
  filename = undefined;
  customElement = undefined;
  css_mode = undefined;
  index = 0;
  stack = [];
  html = undefined;
  css = [];
  js = [];
  meta_tags = {};
  last_auto_closed_tag = undefined;

  constructor(template, options) {
    if (typeof template !== "string") {
      throw new TypeError("Template must be a string");
    }
    this.template = template.trimRight();
    this.filename = options.filename;
    this.customElement = options.customElement;
    this.css_mode = options.css;
    this.html = {
      start: null,
      end: null,
      type: "Fragment",
      children: [],
    };
    this.stack.push(this.html);

    let state = fragment;
    while (this.index < this.template.length) {
      state = state(this) || fragment;
    }
    if (this.stack.length > 1) {
      const current = this.current();
      const type = current.type === "Element" ? `<${current.name}>` : "Block";
      const slug = current.type === "Element" ? "element" : "block";
      this.error(
        {
          code: `unclosed-${slug}`,
          message: `${type} was left open`,
        },
        current.start
      );
    }
    if (state !== fragment) {
      this.error({
        code: "unexpected-eof",
        message: "Unexpected end of input",
      });
    }
    if (this.html.children.length) {
      let start = this.html.children[0].start;
      while (regex_whitespace.test(template[start])) start += 1;
      let end = this.html.children[this.html.children.length - 1].end;
      while (regex_whitespace.test(template[end - 1])) end -= 1;
      this.html.start = start;
      this.html.end = end;
    } else {
      this.html.start = this.html.end = null;
    }
  }
  current() {
    return this.stack[this.stack.length - 1];
  }

  acorn_error(err) {
    this.error(
      {
        code: "parse-error",
        message: err.message.replace(regex_position_indicator, ""),
      },
      err.pos
    );
  }

  error({ code, message }, index = this.index) {
    error(message, {
      name: "ParseError",
      code,
      source: this.template,
      start: index,
      filename: this.filename,
    });
  }

  eat(str, required, error) {
    if (this.match(str)) {
      this.index += str.length;
      return true;
    }
    if (required) {
      this.error(
        error ||
          (this.index === this.template.length
            ? parser_errors.unexpected_eof_token(str)
            : parser_errors.unexpected_token(str))
      );
    }
    return false;
  }

  match(str) {
    return this.template.slice(this.index, this.index + str.length) === str;
  }

  match_regex(pattern) {
    const match = pattern.exec(this.template.slice(this.index));
    if (!match || match.index !== 0) return null;
    return match[0];
  }

  allow_whitespace() {
    while (
      this.index < this.template.length &&
      regex_whitespace.test(this.template[this.index])
    ) {
      this.index++;
    }
  }

  read(pattern) {
    const result = this.match_regex(pattern);
    if (result) this.index += result.length;
    return result;
  }

  read_identifier(allow_reserved = false) {
    const start = this.index;
    let i = this.index;
    const code = full_char_code_at(this.template, i);
    if (!isIdentifierStart(code, true)) return null;
    i += code <= 0xffff ? 1 : 2;
    while (i < this.template.length) {
      const code = full_char_code_at(this.template, i);
      if (!isIdentifierChar(code, true)) break;
      i += code <= 0xffff ? 1 : 2;
    }
    const identifier = this.template.slice(this.index, (this.index = i));
    if (!allow_reserved && reserved.has(identifier)) {
      this.error(
        {
          code: "unexpected-reserved-word",
          message: `'${identifier}' is a reserved word in JavaScript and cannot be used here`,
        },
        start
      );
    }
    return identifier;
  }

  read_until(pattern, error_message) {
    if (this.index >= this.template.length) {
      this.error(
        error_message || {
          code: "unexpected-eof",
          message: "Unexpected end of input",
        }
      );
    }
    const start = this.index;
    const match = pattern.exec(this.template.slice(start));
    if (match) {
      this.index = start + match.index;
      return this.template.slice(start, this.index);
    }
    this.index = this.template.length;
    return this.template.slice(start);
  }
  require_whitespace() {
    if (!regex_whitespace.test(this.template[this.index])) {
      this.error({
        code: "missing-whitespace",
        message: "Expected whitespace",
      });
    }
    this.allow_whitespace();
  }
}

export default function parse(template, options = {}) {
  const parser = new Parser(template, options);
  if (parser.css.length > 1) {
    parser.error(parser_errors.duplicate_style, parser.css[1].start);
  }
  const instance_scripts = parser.js.filter(
    (script) => script.context === "default"
  );
  const module_scripts = parser.js.filter(
    (script) => script.context === "module"
  );
  if (instance_scripts.length > 1) {
    parser.error(
      parser_errors.invalid_script_instance,
      instance_scripts[1].start
    );
  }
  if (module_scripts.length > 1) {
    parser.error(parser_errors.invalid_script_module, module_scripts[1].start);
  }
  return {
    html: parser.html,
    css: parser.css[0],
    instance: instance_scripts[0],
    module: module_scripts[0],
  };
}
