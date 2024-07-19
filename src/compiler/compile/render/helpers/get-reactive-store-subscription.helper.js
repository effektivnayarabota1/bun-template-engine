export const getReactiveStoreSubscription = (component, reactive_stores) => {
  return reactive_stores
    .filter((store) => {
      const variable = component.var_lookup.get(store.name.slice(1));
      return !variable || variable.hoistable;
    })
    .map(({ name }) => {
      const store_name = name.slice(1);
      return b`
				${
          component.compile_options.dev &&
          b`@validate_store(${store_name}, '${store_name}');`
        }
				${`$$unsubscribe_${store_name}`} = @subscribe(${store_name}, #value => ${name} = #value)
			`;
    });
};
