export const trim = (nodes) => {
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
};
