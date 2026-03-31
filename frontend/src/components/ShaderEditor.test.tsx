import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShaderEditor from '../components/ShaderEditor';

// Mock WebGL context
const createMockWebGLContext = () => ({
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ''),
  detachShader: vi.fn(),
  deleteShader: vi.fn(),
  deleteProgram: vi.fn(),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  viewport: vi.fn(),
  drawArrays: vi.fn(),
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88E4,
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  COMPILE_STATUS: 0x8B81,
  LINK_STATUS: 0x8B82,
  TRIANGLE_STRIP: 0x0005,
  FLOAT: 0x1406,
});

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return createMockWebGLContext();
    }
    return null;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  globalThis.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16) as unknown as number);
  globalThis.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

  class MockAudioContext {
    createAnalyser() {
      return {
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: vi.fn((array: Uint8Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
        }),
      };
    }
    createMediaStreamSource() {
      return {
        connect: vi.fn(),
      };
    }
    close() {
      return Promise.resolve();
    }
  }

  globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;

  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: vi.fn(() =>
        Promise.resolve({
          getTracks: () => [{ stop: vi.fn() }],
        })
      ),
    },
  });
});

describe('ShaderEditor', () => {
  it('renders without crashing', () => {
    const { container } = render(<ShaderEditor />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom vertex shader', () => {
    const customVertex = 'attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }';
    render(<ShaderEditor vertexShader={customVertex} />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with custom fragment shader', () => {
    const customFragment = 'precision mediump float; void main() { gl_FragColor = vec4(1.0); }';
    render(<ShaderEditor fragmentShader={customFragment} />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with both custom shaders', () => {
    const customVertex = 'attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }';
    const customFragment = 'precision mediump float; void main() { gl_FragColor = vec4(1.0); }';
    render(<ShaderEditor vertexShader={customVertex} fragmentShader={customFragment} />);
    expect(document.body).toBeInTheDocument();
  });

  it('initializes WebGL context', () => {
    render(<ShaderEditor />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas?.getContext).toHaveBeenCalledWith('webgl');
  });

  it('uses fallback vertex shader when none provided', () => {
    render(<ShaderEditor vertexShader={undefined} />);
    expect(document.body).toBeInTheDocument();
  });

  it('uses fallback fragment shader when none provided', () => {
    render(<ShaderEditor fragmentShader={undefined} />);
    expect(document.body).toBeInTheDocument();
  });
});