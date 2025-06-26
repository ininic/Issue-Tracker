# Issue Tracker

Simple backend issue tracking system built with **Node.js**, **Express**, and **PostgreSQL** using **Sequelize**.

## Features

- Create users (regular or support agents)  
- Regular users can report issues  
- Agents can resolve assigned issues  
- Basic error handling and validation  

## Setup

1. Clone the repo  
   ```bash
   git clone https://github.com/ininic/Issue-Tracker.git
2. Install dependencies
   ```bash
   npm install
3. Make sure PostgreSQL is running and a database exists (e.g. issue_tracker).
4. Update the DB connection in db.js if needed.
5. Start the server.
    ```bash
    node index.js
## Testing the API
Use Postman to test the API.

Import the collection from:

```
issue-tracker.postman_collection.json
