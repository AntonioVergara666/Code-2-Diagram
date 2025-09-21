const express = require('express');
const router = express.Router();

// Ruta simple de análisis para probar
router.post('/analyze', (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Análisis básico simulado
    const classCount = (code.match(/class\s+\w+/g) || []).length;
    const functionCount = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(|let\s+\w+\s*=\s*\(|var\s+\w+\s*=\s*\(/g) || []).length;
    const dependencies = (code.match(/require\(['"][^'"]+['"]\)|from\s+['"][^'"]+['"]/g) || []).map(dep => 
      dep.replace(/require\(['"]([^'"]+)['"]\)|from\s+['"]([^'"]+)['"]/, '$1$2')
    );
    
    const analysis = {
      summary: {
        classCount,
        functionCount,
        dependencyCount: dependencies.length,
        totalLines: code.split('\n').length
      },
      dependencies: [...new Set(dependencies)], // Eliminar duplicados
      diagram: generateBasicDiagram(classCount, dependencies),
      warning: language && language !== 'javascript' ? 
        `Análisis completo disponible solo para JavaScript. Usando análisis básico para ${language}` : 
        'Análisis básico - para análisis completo instale todas las dependencias'
    };

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

// Ruta de salud
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Función para generar diagrama básico
function generateBasicDiagram(classCount, dependencies) {
  let diagram = 'graph TD\n';
  
  // Agregar clases
  for (let i = 1; i <= classCount; i++) {
    diagram += `    Class${i}[Class ${i}]\n`;
  }
  
  // Agregar dependencias
  dependencies.forEach((dep, index) => {
    const cleanDep = dep.replace(/[^a-zA-Z0-9]/g, '_');
    diagram += `    ${cleanDep}[${dep}]\n`;
    
    // Conectar todas las clases a esta dependencia
    for (let i = 1; i <= classCount; i++) {
      diagram += `    Class${i} --> ${cleanDep}\n`;
    }
  });
  
  // Conectar clases entre sí si hay más de una
  if (classCount > 1) {
    for (let i = 1; i < classCount; i++) {
      diagram += `    Class${i} --> Class${i + 1}\n`;
    }
  }
  
  return diagram;
}

const axios = require('axios');

// Conexión real con GitHub API
router.post('/github/content', async (req, res) => {
    try {
        const { repoUrl } = req.body;
        
        if (!repoUrl) {
            return res.status(400).json({ error: 'URL de repositorio requerida' });
        }

        // Extraer usuario y repositorio
        const [owner, repo] = repoUrl.split('/').filter(Boolean);
        
        if (!owner || !repo) {
            return res.status(400).json({ error: 'Formato inválido. Usa: usuario/repositorio' });
        }

        // Obtener contenido del repositorio
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents`,
            {
                headers: {
                    'User-Agent': 'Code2Diagram-App',
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // Filtrar solo archivos JavaScript/TypeScript
        const jsFiles = response.data.filter(file => 
            file.name.endsWith('.js') || 
            file.name.endsWith('.ts') ||
            file.name.endsWith('.jsx') ||
            file.name.endsWith('.tsx')
        );

        // Obtener contenido de los primeros 3 archivos
        const filesContent = await Promise.all(
            jsFiles.slice(0, 10000).map(async (file) => {
                try {
                    const fileResponse = await axios.get(file.download_url);
                    return {
                        name: file.name,
                        path: file.path,
                        content: fileResponse.data,
                        language: file.name.endsWith('.ts') ? 'typescript' : 'javascript'
                    };
                } catch (error) {
                    return {
                        name: file.name,
                        path: file.path,
                        content: `// Error cargando el archivo: ${error.message}`,
                        language: 'javascript'
                    };
                }
            })
        );

        res.json({
            success: true,
            files: filesContent,
            repoInfo: { owner, repo },
            totalFiles: jsFiles.length
        });

    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Repositorio no encontrado' });
        }
        if (error.response?.status === 403) {
            return res.status(403).json({ error: 'Límite de API excedido' });
        }
        
        res.status(500).json({ error: 'Error al conectar con GitHub' });
    }
});

module.exports = router;