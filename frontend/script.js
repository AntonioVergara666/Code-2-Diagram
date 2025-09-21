// Configuración de Mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
    }
});

// Configuración automática de API URL
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000/api'
  : 'https://code-2-diagram.onrender.com/api';

console.log('🚀 Conectando a API:', API_BASE_URL);


// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showInputMethod('editor');
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('editorBtn').addEventListener('click', () => showInputMethod('editor'));
    document.getElementById('githubBtn').addEventListener('click', () => showInputMethod('github'));
    document.getElementById('uploadBtn').addEventListener('click', () => showInputMethod('upload'));
    document.getElementById('analyzeBtn').addEventListener('click', analyzeCode);
    document.getElementById('loadRepoBtn').addEventListener('click', loadFromGitHub);
    document.getElementById('fileSelectBtn').addEventListener('click', triggerFileSelect);
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
}

// Cambiar entre métodos de entrada
function showInputMethod(method) {
    document.getElementById('editorInput').style.display = 'none';
    document.getElementById('githubInput').style.display = 'none';
    document.getElementById('uploadInput').style.display = 'none';
    
    document.querySelectorAll('.input-btn').forEach(btn => btn.classList.remove('active'));
    
    if (method === 'editor') {
        document.getElementById('editorInput').style.display = 'block';
        document.getElementById('editorBtn').classList.add('active');
        currentInputMethod = 'editor';
    } else if (method === 'github') {
        document.getElementById('githubInput').style.display = 'block';
        document.getElementById('githubBtn').classList.add('active');
        currentInputMethod = 'github';
    } else if (method === 'upload') {
        document.getElementById('uploadInput').style.display = 'block';
        document.getElementById('uploadBtn').classList.add('active');
        currentInputMethod = 'upload';
    }
}

// Analizar código - VERSIÓN REAL
async function analyzeCode() {
    const loadingElement = document.getElementById('loading');
    const codeInput = document.getElementById('codeInput').value;
    
    if (!codeInput.trim()) {
        alert('Por favor, ingresa código para analizar');
        return;
    }
    
    loadingElement.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: codeInput,
                language: 'javascript'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error del servidor: ${response.status}`);
        }
        
        const analysis = await response.json();
        displayAnalysisResults(analysis);
        
    } catch (error) {
        console.error('Error en análisis:', error);
        alert('Error al analizar el código: ' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

async function loadFromGitHub() {
    const repoInput = document.getElementById('repoInput').value.trim();
    
    if (!repoInput) {
        alert('Por favor, ingresa un nombre de repositorio en formato "usuario/repositorio"');
        return;
    }

    // Validar formato
    if (!repoInput.includes('/')) {
        alert('Formato inválido. Debe ser: usuario/repositorio');
        return;
    }

    document.getElementById('loading').style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/github/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repoUrl: repoInput })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al cargar desde GitHub');
        }

        if (!data.files || data.files.length === 0) {
            throw new Error('No se encontraron archivos JavaScript/TypeScript en el repositorio');
        }

        // Mostrar selector de archivos
        showFileSelector(data.files, repoInput);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Mostrar selector de archivos
function showFileSelector(files, repoName) {
    const fileSelector = document.createElement('div');
    fileSelector.className = 'file-selector';
    fileSelector.innerHTML = `
        <div class="file-selector-content">
            <h3>📁 Seleccionar archivo de ${repoName}</h3>
            <div class="file-list">
                ${files.map(file => `
                    <div class="file-item" onclick="selectFile('${file.name}', \`${file.content.replace(/`/g, '\\`')}\`)">
                        <i class="fas fa-file-code"></i>
                        ${file.name}
                    </div>
                `).join('')}
            </div>
            <button class="action-btn" onclick="closeFileSelector()">
                <i class="fas fa-times"></i> Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(fileSelector);
}

function selectFile(fileName, content) {
    document.getElementById('codeInput').value = content;
    showInputMethod('editor');
    closeFileSelector();
    alert(`✅ Archivo "${fileName}" cargado correctamente`);
}

function closeFileSelector() {
    const selector = document.querySelector('.file-selector');
    if (selector) selector.remove();
}

// Manejar selección de archivo
function triggerFileSelect() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('codeInput').value = e.target.result;
        showInputMethod('editor');
    };
    reader.readAsText(file);
}

// Mostrar resultados del análisis
function displayAnalysisResults(analysis) {
    // Actualizar estadísticas
    document.getElementById('classCount').textContent = analysis.summary.classCount;
    document.getElementById('methodCount').textContent = analysis.summary.functionCount;
    document.getElementById('dependencyCount').textContent = analysis.summary.dependencyCount;
    
    // Generar diagrama
    generateDiagram(analysis.diagram);
    
    // Mostrar dependencias
    const dependenciesList = document.querySelector('.dependencies-list');
    dependenciesList.innerHTML = '';
    
    if (analysis.dependencies && analysis.dependencies.length > 0) {
        analysis.dependencies.forEach(dep => {
            const li = document.createElement('li');
            li.textContent = dep;
            dependenciesList.appendChild(li);
        });
    } else {
        dependenciesList.innerHTML = '<li>No se detectaron dependencias externas</li>';
    }
    
    // Mostrar issues
    const issuesList = document.querySelector('.issues-list');
    issuesList.innerHTML = '';
    
    const issues = detectIssues(analysis);
    issues.forEach(issue => {
        const li = document.createElement('li');
        li.textContent = issue;
        issuesList.appendChild(li);
    });
    
    // Mostrar recomendaciones
    const recommendationsList = document.querySelector('.recommendations-list');
    recommendationsList.innerHTML = '';
    
    const recommendations = generateRecommendations(analysis);
    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsList.appendChild(li);
    });
}

// Generar diagrama
function generateDiagram(diagramDefinition) {
    const diagramElement = document.getElementById('diagram');
    
    try {
        // Limpiar contenedor
        diagramElement.innerHTML = '';
        
        // Crear elemento para Mermaid
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = diagramDefinition;
        diagramElement.appendChild(mermaidDiv);
        
        // Renderizar diagrama
        mermaid.init(undefined, diagramElement.querySelector('.mermaid'));
        
    } catch (error) {
        console.error('Error renderizando diagrama:', error);
        diagramElement.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Error al generar el diagrama visual</p>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: left;">
${diagramDefinition}
                </pre>
            </div>
        `;
    }
}

// Detectar issues
function detectIssues(analysis) {
    const issues = [];
    const analysisStr = JSON.stringify(analysis).toLowerCase();
    
    if (analysisStr.includes('select *') || analysisStr.includes('insert into')) {
        issues.push('Posible vulnerabilidad de SQL injection');
    }
    
    if (analysisStr.includes('password') || analysisStr.includes('secret') || analysisStr.includes('token')) {
        issues.push('Posible exposición de información sensible');
    }
    
    if (analysis.summary.dependencyCount > 10) {
        issues.push('Alto número de dependencias externas');
    }
    
    if (analysis.summary.classCount === 0 && analysis.summary.functionCount > 5) {
        issues.push('Código procedural detectado - considera usar clases');
    }
    
    if (issues.length === 0) {
        issues.push('No se detectaron issues críticos');
    }
    
    return issues;
}

// Generar recomendaciones
function generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.summary.dependencyCount === 0) {
        recommendations.push('Considera usar librerías externas para funcionalidades comunes');
    }
    
    if (analysis.summary.classCount > 5) {
        recommendations.push('Muchas clases detectadas - considera modularizar el código');
    }
    
    recommendations.push('Implementa manejo de errores con try/catch');
    recommendations.push('Usa variables de entorno para configuraciones sensibles');
    recommendations.push('Considera añadir tests automatizados');
    recommendations.push('Documenta las funciones y clases principales');
    
    return recommendations;
}

// Verificar conexión al backend
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexión con backend establecida');
        } else {
            console.warn('⚠️ Backend respondió con error');
        }
    } catch (error) {
        console.warn('⚠️ No se pudo conectar al backend:', error.message);
    }
}