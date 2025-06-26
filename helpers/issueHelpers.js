const User = require('../Models/User');
const Issue = require('../Models/Issue');

async function assignIssueToFreeAgent(issue) {
  // Get all agents who are available
  const freeAgents = await User.findAll({
    where: {
      role: 'agent',
      isAvailable: true
    }
  });

  // If we find one or more, assign the issue to the first one
  if (freeAgents.length > 0) {
    const agent = freeAgents[0];

    // Assign the issue to this agent
    issue.assignedAgentId = agent.id;
    issue.status = 'assigned';
    await issue.save();

    // Mark the agent as unavailable
    agent.isAvailable = false;
    await agent.save();

    return agent.id; // Return the assigned agent ID
  }

  return null; // No free agent found
}

module.exports = {
  assignIssueToFreeAgent
};