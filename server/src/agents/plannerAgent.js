function topologicalOrder(nodes, edges) {
  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map(nodes.map((n) => [n.id, []]));
  const incoming = new Map(nodes.map((n) => [n.id, 0]));

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !incoming.has(edge.target)) continue;
    adjacency.get(edge.source).push(edge.target);
    incoming.set(edge.target, incoming.get(edge.target) + 1);
  }

  const queue = nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id);
  const remaining = new Map(incoming);
  const order = [];

  while (queue.length) {
    const id = queue.shift();
    order.push(idToNode.get(id));
    for (const next of adjacency.get(id) || []) {
      remaining.set(next, remaining.get(next) - 1);
      if (remaining.get(next) === 0) queue.push(next);
    }
  }

  return { order, hasCycle: order.length !== nodes.length };
}

function plan(workflow) {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const { order, hasCycle } = topologicalOrder(nodes, edges);

  const confidence = nodes.length === 0 ? 0 : Math.round((order.length / nodes.length) * 100) / 100;

  return { order, confidence, hasCycle };
}

module.exports = { plan };
