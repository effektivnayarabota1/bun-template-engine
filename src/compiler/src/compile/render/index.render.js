import { b } from "code-red";
// import { string_literal } from "../utils/stringify.js";
// import { extract_names } from "periscopic";
// import { walk } from "estree-walker";
// import { invalidate } from "../render_dom/invalidate.js";
// import check_enable_sourcemap from "../utils/check_enable_sourcemap.js";

import Renderer from "./Renderer.js";
import { trim } from "./helpers/trim.helper.js";
import { walkComponentAstInstance } from "./helpers/walk-component-ast-instance.helper.js";
import { componentRewriteProps } from "./helpers/component-rewrite-props.helper.js";
import { getParentBindings } from "./helpers/get-parent-bindings.helper.js";
import { mainHelper } from "./helpers/main.helper.js";
import { getReactiveStores } from "./helpers/get-reactive-stores.helper.js";
import { getReactiveStoreSubscription } from "./helpers/get-reactive-store-subscription.helper.js";
import { getReactiveStoreUnsubscriptions } from "./helpers/get-reactive-store-unsubscriptions.helper.js";
import { getReactiveStoreDeclarations } from "./helpers/get-reactive-store-declaration.helper.js";

// TODO все опирации со store в отдельную директорию

export const renderSsr = (component, options) => {
  const { name } = component;
  const renderer = new Renderer({ name });

  // * main
  // остальная работа идет с объектом renderer
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

  // TODO выноси
  const css = component.stylesheet.render(options.filename);

  // TODO выноси
  const props = component.vars.filter(
    (variable) => !variable.module && variable.export_name
  );

  // TODO move
  // rest
  const uses_rest = component.var_lookup.has("$$restProps");
  const rest = uses_rest
    ? b`let $$restProps = @compute_rest_props($$props, [${props
        .map((prop) => `"${prop.export_name}"`)
        .join(",")}]);`
    : null;

  // TODO move
  // slots
  const uses_slots = component.var_lookup.has("$$slots");
  const slots = uses_slots ? b`let $$slots = @compute_slots(#slots);` : null;

  const reactive_stores = getReactiveStores(component);

  const reactive_store_subscriptions = getReactiveStoreSubscription(
    component,
    reactive_stores
  );

  const reactive_store_unsubscriptions =
    getReactiveStoreUnsubscriptions(reactive_stores);

  const reactive_store_declarations = getReactiveStoreDeclarations(
    component,
    reactive_stores
  );

  // !IMPORTANT
  if (component.ast.instance) {
    walkComponentAstInstance(component);
  }

  // !IMPORTANT
  componentRewriteProps(component);

  const instance_javascript = component.extract_javascript(
    component.ast.instance
  );

  const parent_bindings = getParentBindings(component, instance_javascript);

  // TODO move
  const injected = Array.from(
    component.injected_reactive_declaration_vars
  ).filter((name) => {
    const variable = component.var_lookup.get(name);
    return variable.injected;
  });

  // TODO move
  const reactive_declarations = component.reactive_declarations.map((d) => {
    const body = d.node.body;
    let statement = b`${body}`;
    if (!d.declaration) {
      statement = b`$: { ${statement} }`;
    }
    return statement;
  });

  // !IMPORTANT
  const main = mainHelper({
    renderer,
    reactive_declarations,
    reactive_store_unsubscriptions,
    literal,
  });

  // TODO move
  // getBlocks
  const blocks = [
    ...injected.map((name) => b`let ${name};`),
    rest,
    slots,
    instance_javascript,
    ...parent_bindings,
    css.code && b`$$result.css.add(#css);`,
    main,
  ].filter(Boolean);

  //   const css_sourcemap_enabled = check_enable_sourcemap(
  //     options.enableSourcemap,
  //     "css"
  //   );

  // TODO
  // getJs
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

  // в каком виде здесть сохраняется JS?

  // ***

  return { js, css };
};
