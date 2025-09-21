// Servicio simulado de GitHub para demo
async function getRepoContent(repoUrl) {
  try {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Datos de ejemplo para demo
    return {
      success: true,
      files: [
        {
          name: 'app.js',
          path: 'app.js',
          content: `// Aplicación de ejemplo
const express = require('express');
const app = express();
const port = 3000;

class Server {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(express.json());
  }
  
  setupRoutes() {
    this.app.get('/', (req, res) => {
      res.send('Hello World!');
    });
    
    this.app.get('/api/users', (req, res) => {
      res.json([{ name: 'John' }, { name: 'Jane' }]);
    });
  }
  
  start() {
    this.app.listen(port, () => {
      console.log(\`Server running on port \${port}\`);
    });
  }
}

const server = new Server();
server.start();`,
          language: 'javascript'
        }
      ],
      repoInfo: {
        owner: 'example',
        repo: 'demo'
      }
    };
  } catch (error) {
    throw new Error('Failed to fetch repository content: ' + error.message);
  }
}

module.exports = {
  getRepoContent
};