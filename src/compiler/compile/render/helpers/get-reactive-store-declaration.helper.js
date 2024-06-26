export const getReactiveStoreDeclarations = (component, reactive_stores) => {
  return reactive_stores.map(({ name }) => {
    const store_name = name.slice(1);
    const store = component.var_lookup.get(store_name);
    if (store && store.reassigned) {
      const unsubscribe = `$$unsubscribe_${store_name}`;
      const subscribe = `$$subscribe_${store_name}`;
      return b`let ${name}, ${unsubscribe} = @noop, ${subscribe} = () => (${unsubscribe}(), ${unsubscribe} = @subscribe(${store_name}, $$value => ${name} = $$value), ${store_name})`;
    }
    return b`let ${name}, ${`$$unsubscribe_${store_name}`};`;
  });
};
