import { b } from "code-red";
import { string_literal } from "../utils/stringify.js";
import Renderer from "./Renderer.js";
import { extract_names } from "periscopic";
import { walk } from "estree-walker";
import { invalidate } from "../render_dom/invalidate.js";
import check_enable_sourcemap from "../utils/check_enable_sourcemap.js";

export const renderSsr = (component, options) => {
  const renderer = new Renderer({
    name: component.name,
  });

  const { name } = component;

  renderer.render(
    trim(component.fragment.children),
    Object.assign(
      {
        locate: component.locate,
      },
      options
    )
  );

  const literal = renderer.pop();

  const css = component.stylesheet.render(options.filename);

  const props = component.vars.filter(
    (variable) => !variable.module && variable.export_name
  );

  const uses_rest = component.var_lookup.has("$$restProps");
  const rest = uses_rest
    ? b`let $$restProps = @compute_rest_props($$props, [${props
        .map((prop) => `"${prop.export_name}"`)
        .join(",")}]);`
    : null;

  const uses_slots = component.var_lookup.has("$$slots");
  const slots = uses_slots ? b`let $$slots = @compute_slots(#slots);` : null;

  if (component.ast.instance) {
    let scope = component.instance_scope;
    const map = component.instance_scope_map;
    walk(component.ast.instance.content, {
      enter(node) {
        if (map.has(node)) {
          scope = map.get(node);
        }
      },
      leave(node) {
        if (map.has(node)) {
          scope = scope.parent;
        }
        if (
          node.type === "AssignmentExpression" ||
          node.type === "UpdateExpression"
        ) {
          const assignee =
            node.type === "AssignmentExpression" ? node.left : node.argument;
          const names = new Set(extract_names(assignee));
          const to_invalidate = new Set();
          for (const name of names) {
            const variable = component.var_lookup.get(name);
            if (
              variable &&
              !variable.hoistable &&
              !variable.global &&
              !variable.module &&
              (variable.subscribable || variable.name[0] === "$")
            ) {
              to_invalidate.add(variable.name);
            }
          }
          if (to_invalidate.size) {
            this.replace(
              invalidate({ component }, scope, node, to_invalidate, true)
            );
          }
        }
      },
    });
  }
  component.rewrite_props(({ name, reassigned }) => {
    const value = `$${name}`;
    let insert = reassigned
      ? b`${`$$subscribe_${name}`}()`
      : b`${`$$unsubscribe_${name}`} = @subscribe(${name}, #value => $${value} = #value)`;
    if (component.compile_options.dev) {
      insert = b`@validate_store(${name}, '${name}'); ${insert}`;
    }
    return insert;
  });
  const instance_javascript = component.extract_javascript(
    component.ast.instance
  );
  const parent_bindings = instance_javascript
    ? component.vars
        .filter((variable) => !variable.module && variable.export_name)
        .map((prop) => {
          return b`if ($$props.${prop.export_name} === void 0 && $$bindings.${prop.export_name} && ${prop.name} !== void 0) $$bindings.${prop.export_name}(${prop.name});`;
        })
    : [];
  const injected = Array.from(
    component.injected_reactive_declaration_vars
  ).filter((name) => {
    const variable = component.var_lookup.get(name);
    return variable.injected;
  });
  const reactive_declarations = component.reactive_declarations.map((d) => {
    const body = d.node.body;
    let statement = b`${body}`;
    if (!d.declaration) {
      statement = b`$: { ${statement} }`;
    }
    return statement;
  });

  const main = renderer.has_bindings
    ? b`
			let $$settled;
			let $$rendered;
			let #previous_head = $$result.head;

			do {
				$$settled = true;
				// $$result.head is mutated by the literal expression
				// need to reset it if we're looping back to prevent duplication
				$$result.head = #previous_head;

				${reactive_declarations}

				$$rendered = ${literal};
			} while (!$$settled);

			${reactive_store_unsubscriptions}

			return $$rendered;
		`
    : b`

			return ${literal};`;

  const blocks = [
    ...injected.map((name) => b`let ${name};`),
    rest,
    slots,
    instance_javascript,
    ...parent_bindings,
    css.code && b`$$result.css.add(#css);`,
    main,
  ].filter(Boolean);

  const css_sourcemap_enabled = check_enable_sourcemap(
    options.enableSourcemap,
    "css"
  );

  const js = b`
		${
      css.code
        ? b`
		const #css = {
			code: "${css.code}",
		};`
        : null
    }

		${component.extract_javascript(component.ast.module)}

		${component.fully_hoisted}

		const ${name} = @create_ssr_component(($$result, $$props, $$bindings, #slots) => {
			${blocks}
		});
	`;

  console.log(js);
  console.log(css);

  return { js, css };
};

function trim(nodes) {
  let start = 0;
  for (; start < nodes.length; start += 1) {
    const node = nodes[start];
    if (node.type !== "Text") break;
    node.data = node.data.replace(/^\s+/, "");
    if (node.data) break;
  }
  let end = nodes.length;
  for (; end > start; end -= 1) {
    const node = nodes[end - 1];
    if (node.type !== "Text") break;
    node.data = node.data.trimRight();
    if (node.data) break;
  }
  return nodes.slice(start, end);
}
