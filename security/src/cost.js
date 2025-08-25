let current = 0;

function checkBudget(currentBudget, add) {
  const total = currentBudget + add;
  if (total > 0.10) {
    throw { code: 'BUDGET-429', message: 'Task Exceeded' };
  }
  console.log(`Thermonuclear Budget: ${total}`);
  return total;
}

export { checkBudget, current };

// Dummy call with session track mock global current=0
checkBudget(current, 0.05);