import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';

interface ShaderEditorProps {
  vertexShader?: string;
  fragmentShader?: string;
  onShaderChange?: (vertex: string, fragment: string) => void;
}

const DEFAULT_VERTEX_SHADER = `attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const DEFAULT_FRAGMENT_SHADER = `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_audioLevel;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  
  vec3 color = vec3(0.0);
  float wave = sin(st.x * 10.0 + u_time * 2.0) * 0.5 + 0.5;
  
  color.r = wave * (1.0 - st.y);
  color.g = sin(u_time + st.x * 5.0) * 0.5 + 0.5;
  color.b = cos(u_time * 0.7 + st.y * 3.0) * 0.5 + 0.5;
  
  color *= 0.8 + u_audioLevel * 0.5;
  
  gl_FragColor = vec4(color, 1.0);
}`;

const ShaderEditor: React.FC<ShaderEditorProps> = ({
  vertexShader = DEFAULT_VERTEX_SHADER,
  fragmentShader = DEFAULT_FRAGMENT_SHADER,
  onShaderChange
}) => {
  const [localVertexShader, setLocalVertexShader] = useState(vertexShader);
  const [localFragmentShader, setLocalFragmentShader] = useState(fragmentShader);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelRef = useRef<number>(0);

  // Use props when they change
  useEffect(() => {
    setLocalVertexShader(vertexShader);
  }, [vertexShader]);

  useEffect(() => {
    setLocalFragmentShader(fragmentShader);
  }, [fragmentShader]);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      setError('WebGL not supported');
      return false;
    }

    glRef.current = gl;
    
    // Set up full-screen quad
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    return true;
  }, []);

  const compileShader = useCallback((source: string, type: number): WebGLShader | null => {
    const gl = glRef.current;
    if (!gl) return null;

    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(info || 'Shader compilation failed');
    }

    return shader;
  }, []);

  const createProgram = useCallback((vertexSource: string, fragmentSource: string): WebGLProgram | null => {
    const gl = glRef.current;
    if (!gl) return null;

    const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
    if (!vertexShader) return null;

    const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    if (!fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(info || 'Program linking failed');
    }

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }, [compileShader]);

  const initAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch (err) {
      console.warn('Audio initialization failed:', err);
    }
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!gl || !program) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    let audioLevel = 0;
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      audioLevel = sum / (dataArray.length * 255);
    }
    audioLevelRef.current = audioLevel;

    const canvas = canvasRef.current;
    if (canvas) {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    }

    const u_time = (Date.now() - startTimeRef.current) / 1000;
    const u_resolution = canvas ? [canvas.width, canvas.height] : [800, 600];
    const u_audioLevel = audioLevel;

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const audioLevelLocation = gl.getUniformLocation(program, 'u_audioLevel');

    if (timeLocation) gl.uniform1f(timeLocation, u_time);
    if (resolutionLocation) gl.uniform2f(resolutionLocation, u_resolution[0], u_resolution[1]);
    if (audioLevelLocation) gl.uniform1f(audioLevelLocation, u_audioLevel);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  const recompileShaders = useCallback((vertex: string, fragment: string) => {
    setIsCompiling(true);
    setError(null);

    try {
      const newProgram = createProgram(vertex, fragment);
      if (newProgram) {
        if (programRef.current) {
          glRef.current?.deleteProgram(programRef.current);
        }
        programRef.current = newProgram;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCompiling(false);
    }
  }, [createProgram]);

  useEffect(() => {
    if (!initWebGL()) return;
    
    const init = async () => {
      await initAudio();
      recompileShaders(localVertexShader, localFragmentShader);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    init();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (programRef.current) {
        glRef.current?.deleteProgram(programRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [initWebGL, initAudio, recompileShaders, localVertexShader, localFragmentShader, render]);

  const handleVertexChange = (value: string | undefined) => {
    const newVertex = value || DEFAULT_VERTEX_SHADER;
    setLocalVertexShader(newVertex);
    if (onShaderChange) onShaderChange(newVertex, localFragmentShader);
  };

  const handleFragmentChange = (value: string | undefined) => {
    const newFragment = value || DEFAULT_FRAGMENT_SHADER;
    setLocalFragmentShader(newFragment);
    if (onShaderChange) onShaderChange(localVertexShader, newFragment);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      recompileShaders(localVertexShader, localFragmentShader);
    }, 500);
    return () => clearTimeout(timer);
  }, [localVertexShader, localFragmentShader, recompileShaders]);

  return (
    <div className="shader-editor h-full flex flex-col">
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full absolute top-0 left-0"
        />
        {isCompiling && (
          <div className="absolute top-2 right-2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded text-sm">
            Compiling...
          </div>
        )}
        {error && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-100 border border-red-400 text-red-800 px-3 py-2 rounded text-sm max-h-32 overflow-auto">
            <strong>Shader Error:</strong> {error}
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          FPS: {fps}
        </div>
      </div>
      <div className="h-96 border-t border-gray-300 flex">
        <div className="w-1/2 border-r border-gray-300">
          <div className="bg-gray-800 text-white px-3 py-2 text-sm font-mono">
            Vertex Shader
          </div>
          <Editor
            height="calc(100% - 32px)"
            defaultLanguage="glsl"
            theme="vs-dark"
            value={localVertexShader}
            onChange={handleVertexChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              fontSize: 12,
            }}
          />
        </div>
        <div className="w-1/2">
          <div className="bg-gray-800 text-white px-3 py-2 text-sm font-mono">
            Fragment Shader
          </div>
          <Editor
            height="calc(100% - 32px)"
            defaultLanguage="glsl"
            theme="vs-dark"
            value={localFragmentShader}
            onChange={handleFragmentChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              fontSize: 12,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ShaderEditor;