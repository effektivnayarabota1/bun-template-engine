export const getReactiveStoreUnsubscriptions = (reactive_stores) => {
  return reactive_stores.map(
    ({ name }) => b`${`$$unsubscribe_${name.slice(1)}`}()`
  );
};
