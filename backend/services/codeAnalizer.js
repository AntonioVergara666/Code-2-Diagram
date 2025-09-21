// Análisis básico de código
function analyzeCode(code, language = 'javascript') {
  try {
    // Contar clases
    const classCount = (code.match(/class\s+\w+/g) || []).length;
    
    // Contar funciones
    const functionCount = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(|let\s+\w+\s*=\s*\(|var\s+\w+\s*=\s*\(/g) || []).length;
    
    // Encontrar dependencias
    const dependencies = (code.match(/require\(['"][^'"]+['"]\)|from\s+['"][^'"]+['"]/g) || []).map(dep => 
      dep.replace(/require\(['"]([^'"]+)['"]\)|from\s+['"]([^'"]+)['"]/, '$1$2')
    );
    
    // Generar diagrama básico
    const diagram = generateBasicDiagram(classCount, dependencies);
    
    return {
      classes: Array.from({ length: classCount }, (_, i) => ({
        name: `Class${i + 1}`,
        methods: [],
        properties: []
      })),
      functions: Array.from({ length: functionCount }, (_, i) => ({
        name: `Function${i + 1}`,
        parameters: []
      })),
      dependencies: [...new Set(dependencies)], // Eliminar duplicados
      diagram,
      summary: {
        classCount,
        functionCount,
        dependencyCount: dependencies.length,
        totalLines: code.split('\n').length
      }
    };
  } catch (error) {
    throw new Error('Failed to analyze code: ' + error.message);
  }
}

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
  
  return diagram;
}

module.exports = {
  analyzeCode
};