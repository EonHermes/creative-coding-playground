import React, { useState } from 'react';
import ShaderEditor from './components/ShaderEditor';
import './App.css';

const App: React.FC = () => {
  const [vertexShader, setVertexShader] = useState<string>(`attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`);

  const [fragmentShader, setFragmentShader] = useState<string>(`precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_audioLevel;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  
  // Create animated pattern
  vec3 color = vec3(0.0);
  float wave = sin(st.x * 10.0 + u_time * 2.0) * 0.5 + 0.5;
  
  color.r = wave * (1.0 - st.y);
  color.g = sin(u_time + st.x * 5.0) * 0.5 + 0.5;
  color.b = cos(u_time * 0.7 + st.y * 3.0) * 0.5 + 0.5;
  
  // Add audio reactivity
  color *= 0.8 + u_audioLevel * 0.5;
  
  gl_FragColor = vec4(color, 1.0);
}`);

  const exportAsImage = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `shader-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  const exportAsCode = () => {
    const code = `// Vertex Shader\n${vertexShader}\n\n// Fragment Shader\n${fragmentShader}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shader-code-${Date.now()}.glsl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShaderChange = (vertex: string, fragment: string) => {
    setVertexShader(vertex);
    setFragmentShader(fragment);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Creative Coding Playground</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time WebGL shader editor with audio reactivity
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportAsImage}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Export as Image
          </button>
          <button
            onClick={exportAsCode}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Export as Code
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative">
          <ShaderEditor 
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            onShaderChange={handleShaderChange}
          />
        </div>
        
        <div className="bg-gray-100 border-t border-gray-300 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">About This Project</h2>
          <div className="text-sm text-gray-600 max-w-4xl">
            <p>
              The <strong>Creative Coding Playground</strong> is a browser-based environment for writing, 
              previewing, and exporting WebGL shaders in real-time.
            </p>
            <h3 className="font-semibold mt-3 mb-1">Features:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Live WebGL rendering with instant feedback</li>
              <li>Monaco Editor with GLSL syntax highlighting</li>
              <li>Audio reactivity input from microphone</li>
              <li>Export as PNG image or GLSL code</li>
              <li>Uniforms: u_time, u_resolution, u_mouse, u_audioLevel</li>
              <li>Auto-compilation with error reporting</li>
              <li>Full-screen canvas display</li>
              <li>Real-time FPS counter</li>
            </ul>
            <h3 className="font-semibold mt-3 mb-1">Tech Stack:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Frontend:</strong> React, TypeScript, Vite</li>
              <li><strong>Rendering:</strong> WebGL (GLSL shaders)</li>
              <li><strong>Editor:</strong> Monaco Editor</li>
              <li><strong>Audio:</strong> Web Audio API</li>
              <li><strong>Testing:</strong> Vitest, React Testing Library</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;