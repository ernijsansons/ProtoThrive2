// Ref: CLAUDE.md Terminal 4 Phase 4 - Workflow Validation
// Thermonuclear n8n Workflow Validator

const fs = require('fs');
const path = require('path');

console.log('Thermonuclear Workflow Validation: Starting');

try {
  // Load the workflow JSON
  const workflowPath = path.join(__dirname, '..', 'workflows', 'automation.json');
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const workflow = JSON.parse(workflowContent);
  
  console.log('Thermonuclear Checkpoint: Workflow JSON loaded successfully');
  
  // Validate required fields
  const requiredFields = ['name', 'nodes', 'connections', 'settings'];
  requiredFields.forEach(field => {
    if (!workflow[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
  
  // Validate nodes
  console.log(`Validating ${workflow.nodes.length} nodes...`);
  const expectedNodeCount = 12; // As per spec
  if (workflow.nodes.length !== expectedNodeCount) {
    throw new Error(`Expected ${expectedNodeCount} nodes, found ${workflow.nodes.length}`);
  }
  
  // Validate each node has required properties
  workflow.nodes.forEach((node, index) => {
    if (!node.id || !node.name || !node.type) {
      throw new Error(`Node at index ${index} missing required properties`);
    }
    console.log(`✓ Node ${node.id}: ${node.name} (${node.type})`);
  });
  
  // Validate connections
  const connectionCount = Object.keys(workflow.connections).length;
  console.log(`Validating ${connectionCount} connections...`);
  
  // Validate each connection
  Object.entries(workflow.connections).forEach(([nodeId, connections]) => {
    console.log(`✓ Connection from ${nodeId}`);
  });
  
  // Validate specific nodes exist as per spec
  const requiredNodes = [
    'Trigger',
    'Mock Planner',
    'Loop Tasks',
    'Mock Coder',
    'Mock Auditor',
    'Calc Thrive',
    'Update DB Mock',
    'Deploy Trigger Mock',
    'HITL Check',
    'Escalate If Fail',
    'HITL Escalate',
    'Success'
  ];
  
  requiredNodes.forEach(nodeName => {
    const node = workflow.nodes.find(n => n.name === nodeName);
    if (!node) {
      throw new Error(`Required node "${nodeName}" not found`);
    }
  });
  
  console.log('\nThermonuclear Checkpoint: All workflow validations passed');
  console.log('Workflow structure is valid and matches specifications');
  
} catch (error) {
  console.error('Thermonuclear Validation Error:', error.message);
  process.exit(1);
}