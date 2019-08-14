const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

//Start Server
const server = createServer();

server.express.use(cookieParser());

server.express.use((req, res, next) => {
  // Get the token from the request
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // Put userId onto the req for future requests to access
    req.userId = userId;
  }
  // Pass on the request
  next();
});

// Middleware to populate user on each request
server.express.use(async (req, res, next) => {
  if (!req.userId) return next();
  const user = await db.query.user(
    { where: { id: req.userId } },
    '{ id, permissions, email, name, cart{id quantity}}'
  );
  console.log(user);
  req.user = user;
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL
    }
  },
  deets => {
    console.log(`Server is now running on port http://localhost/${deets.port}`);
  }
);
