import { walk } from "estree-walker";
import { extract_names } from "periscopic";
import { invalidate } from "../../render_dom/invalidate.js";

export const walkComponentAstInstance = (component) => {
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
};
