import React, { memo } from 'react';
import nodes from './legacy-tree.json';
import { ReactFilterControl, ReactFilterResetButton, FILTER_IDS } from '../islands/ReactFilterControls.js';

// This genuinely renders the legacy HTML nodes through React createElement.
// It does NOT yet migrate business logic, event handlers or state to React.
// Never rerender this surface while imperative legacy controllers own its nodes.
function renderNode(node, key) {
  if (typeof node === 'string') return node;
  if (FILTER_IDS.has(node.props?.id)) return <ReactFilterControl key={key} node={node} renderNode={renderNode} />;
  const props = { ...node.props, key };
  const children = node.children.map((child, index) => renderNode(child, index));
  if (node.tag === 'div' && node.props?.className?.split(' ').includes('txTools')) {
    children.push(<ReactFilterResetButton key="react-sales-clear" desk="sales" />);
  }
  if (node.tag === 'div' && node.props?.className?.split(' ').includes('controlsRow') &&
      node.children.some(child => child?.props?.id === 'stockDiv')) {
    children.push(<ReactFilterResetButton key="react-stock-clear" desk="stock" />);
  }
  return React.createElement(node.tag, props, ...children);
}

export const LegacySurface = memo(function LegacySurface() {
  return <>{nodes.map((node, index) => renderNode(node, index))}</>;
});
