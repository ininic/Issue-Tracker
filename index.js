const { assignIssueToFreeAgent } = require('./helpers/issueHelpers');
const express = require('express');
const app = express();
const sequelize = require('./db');
const User = require('./Models/User');
const Issue = require('./Models/Issue');

const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello! Backend is running.');
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/issues', async (req, res) => {
  try {
    const issues = await Issue.findAll();
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  const { name, role } = req.body;
  try {
    // Create the user
    const user = await User.create({ name, role });

    // Only if the user is an agent, try to assign an existing unassigned issue
    if (role === 'agent') {
      const unassignedIssue = await Issue.findOne({ where: { status: 'unassigned' } });

      if (unassignedIssue) {
        unassignedIssue.assignedAgentId = user.id;
        unassignedIssue.status = 'assigned';
        await unassignedIssue.save();

        // Mark agent as unavailable since they now have an assigned issue
        user.isAvailable = false;
        await user.save();
      }
    }

    //Return the created user
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/issues', async (req, res) => {
  const { description, userId } = req.body;
  try {
    // Optional: verify user exists and is a 'user'
    const reportingUser = await User.findOne({ where: { id: userId, role: 'user' } });
    if (!reportingUser) {
      return res.status(400).json({ error: 'Invalid reporting user' });
    }

    // Create the new issue (initially unassigned)
    const issue = await Issue.create({ description, status: 'unassigned' });

    // Try to assign the issue to a free agent
    await assignIssueToFreeAgent(issue);
    
    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/issues/:id/resolve', async (req, res) => {
  const issueId = req.params.id;

  try {
    // Fetch the issue from the database
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.status === 'resolved') {
      return res.status(400).json({ error: 'The issue has already been resolved' });
    }

    if (issue.status !== 'assigned') {
     return res.status(400).json({ error: 'Only assigned issues can be resolved' });
    }

    // Mark the issue as resolved
    issue.status = 'resolved';
    await issue.save();

    // Extract the agent id from the resolved issue
    const agentId = issue.assignedAgentId;

    // Mark the agent as available now
    const agent = await User.findByPk(agentId);
    if (agent) {
      agent.isAvailable = true;
      await agent.save();
    }

    // Look for the next available unassigned issue
    const nextIssue = await Issue.findOne({
      where: { status: 'unassigned' },
      order: [['createdAt', 'ASC']]
    });

    // If an unassigned issue is found, assign it to the free agent
    if (nextIssue && agent) {
      nextIssue.assignedAgentId = agent.id;
      nextIssue.status = 'assigned';
      await nextIssue.save();

      agent.isAvailable = false;
      await agent.save();
    }

    // Respond with a message indicating success
    res.json({
      message: 'Issue resolved. ' +
        (nextIssue
          ? `New issue (ID: ${nextIssue.id}) assigned to agent ${agentId}.`
          : 'No unassigned issues available to reassign.')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

sequelize.sync({ force: false }) // Creates tables if not exist
  .then(() => {
    console.log('DB synced');
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('DB connection error:', err);
  });