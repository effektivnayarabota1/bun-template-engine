export const getParentBindings = (component, instance_javascript) => {
  return instance_javascript
    ? component.vars
        .filter((variable) => !variable.module && variable.export_name)
        .map((prop) => {
          return b`if ($$props.${prop.export_name} === void 0 && $$bindings.${prop.export_name} && ${prop.name} !== void 0) $$bindings.${prop.export_name}(${prop.name});`;
        })
    : [];
};
