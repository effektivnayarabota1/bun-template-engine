export const getReactiveStores = (component) => {
  return component.vars.filter(
    (variable) => variable.name[0] === "$" && variable.name[1] !== "$"
  );
};
