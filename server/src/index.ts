import http from 'http';
import app from './app';
import { initSocket } from './socket';

const PORT = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server, frontendUrl);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
