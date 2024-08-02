export const componentRewriteProps = (component) => {
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
};
