import { validateScenario } from './core.mjs';

function mutation(parameter, value) {
  return {
    selector: parameter.selector,
    attribute: parameter.attribute,
    value: value.value,
    expectedMatches: parameter.expectedMatches ?? 1
  };
}

function assertion(parameter, value) {
  return {
    type: 'attribute',
    selector: parameter.selector,
    attribute: parameter.attribute,
    value: value.value
  };
}

function pluginScenarios(plugin) {
  const scenarios = [];
  const parameters = plugin.parameters || [];
  for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex += 1) {
    const parameter = parameters[parameterIndex];
    for (const value of parameter.values || []) {
      scenarios.push({
        id: `mx-${plugin.id}-s-${parameterIndex + 1}-${value.id}`,
        title: `${plugin.id}: ${parameter.attribute}=${value.value}`,
        matrix: { plugin: plugin.id, kind: 'single', parameters: [parameter.attribute], valueKinds: [value.kind] },
        mutations: [mutation(parameter, value)],
        assertions: [assertion(parameter, value), ...(plugin.global ? [{ type: 'global', path: plugin.global }] : [])]
      });
    }
  }
  for (let left = 0; left < parameters.length; left += 1) {
    for (let right = left + 1; right < parameters.length; right += 1) {
      const leftValues = parameters[left].values.slice(0, 2);
      const rightValues = parameters[right].values.slice(0, 2);
      for (const leftValue of leftValues) {
        for (const rightValue of rightValues) {
          scenarios.push({
            id: `mx-${plugin.id}-p-${left + 1}${leftValue.id}-${right + 1}${rightValue.id}`,
            title: `${plugin.id}: pair ${parameters[left].attribute} + ${parameters[right].attribute}`,
            matrix: {
              plugin: plugin.id,
              kind: 'pairwise',
              parameters: [parameters[left].attribute, parameters[right].attribute],
              valueKinds: [leftValue.kind, rightValue.kind]
            },
            mutations: [mutation(parameters[left], leftValue), mutation(parameters[right], rightValue)],
            assertions: [assertion(parameters[left], leftValue), assertion(parameters[right], rightValue), ...(plugin.global ? [{ type: 'global', path: plugin.global }] : [])]
          });
        }
      }
    }
  }
  return scenarios.map(validateScenario);
}

export function generateMatrix(contract, limit = contract.limit || 320) {
  const queues = (contract.plugins || []).map(pluginScenarios);
  const generated = [];
  let cursor = 0;
  while (generated.length < limit && queues.some(queue => queue.length)) {
    const queue = queues[cursor % queues.length];
    if (queue.length) generated.push(queue.shift());
    cursor += 1;
  }
  return generated;
}

export function summarizeMatrix(scenarios) {
  const summary = { total: scenarios.length, single: 0, pairwise: 0, valid: 0, boundary: 0, invalid: 0, plugins: {} };
  for (const scenario of scenarios) {
    const metadata = scenario.matrix || {};
    if (metadata.kind) summary[metadata.kind] += 1;
    summary.plugins[metadata.plugin] = (summary.plugins[metadata.plugin] || 0) + 1;
    for (const kind of metadata.valueKinds || []) if (kind in summary) summary[kind] += 1;
  }
  return summary;
}
