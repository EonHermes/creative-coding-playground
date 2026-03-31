# Creative Coding Playground 🎨

A browser-based creative coding environment for writing, previewing, and exporting WebGL shaders in real-time with audio reactivity features.

![Creative Coding Playground](https://github.com/EonHermes/creative-coding-playground/raw/main/frontend/public/hero.png)

## ✨ Features

- **Live WebGL Rendering**: Real-time shader compilation and rendering with instant feedback
- **Monaco Editor Integration**: Full GLSL syntax highlighting, autocompletion, and error checking
- **Audio Reactivity**: Connect your microphone to drive shader parameters with u_audioLevel uniform
- **Export Capabilities**:
  - 📸 Export as PNG image (current frame capture)
  - 📝 Export shader code as GLSL files
- **Real-time FPS Counter**: Monitor rendering performance
- **Auto-compilation**: Debounced automatic recompilation with error reporting
- **Responsive Design**: Full-screen canvas that adapts to window size
- **Professional UI**: Clean dark theme optimized for long creative sessions

## 🎯 Uniforms

The shader environment provides these built-in uniforms:

| Uniform | Type | Description |
|---------|------|-------------|
| `u_time` | `float` | Elapsed time in seconds |
| `u_resolution` | `vec2` | Canvas dimensions in pixels |
| `u_mouse` | `vec2` | Current mouse position |
| `u_audioLevel` | `float` | Normalized audio level (0.0-1.0) from microphone |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/EonHermes/creative-coding-playground.git
cd creative-coding-playground/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open your browser to `http://localhost:5173` (or the port shown in terminal).

### Building for Production

```bash
npm run build
npm run preview
```

## 📖 Usage

1. **Write your shader**: Edit the vertex and fragment shaders in the left and right panels
2. **Watch it render**: Changes compile automatically (500ms debounce) and render in real-time
3. **Enable audio**: Click allow when prompted for microphone access to enable audio reactivity
4. **Export**: Use the buttons in the header to export your creation as an image or code

### Example Shader

Try this beautiful plasma effect in the fragment shader:

```glsl
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_audioLevel;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  st.x *= u_resolution.x / u_resolution.y;
  
  vec3 color = vec3(0.0);
  
  for(float i = 1.0; i < 4.0; i++){
    st.x += 0.6 / i * cos(i * 3.0 * st.y + u_time);
    st.y += 0.6 / i * cos(i * 3.0 * st.x + u_time);
  }
  
  color.r = 0.5 + 0.5 * sin(u_time + st.x * 10.0);
  color.g = 0.5 + 0.5 * cos(u_time + st.y * 10.0);
  color.b = 0.5 + 0.5 * sin(u_time + (st.x + st.y) * 5.0);
  
  // Audio reactivity pulsing
  color += u_audioLevel * 0.3;
  
  gl_FragColor = vec4(color, 1.0);
}
```

## 🧪 Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run
```

The test suite includes unit tests for the ShaderEditor component with WebGL mocking.

## 🏗 Project Architecture

```
creative-coding-playground/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ShaderEditor.tsx        # Main WebGL renderer with Monaco editor
│   │   │   └── ShaderEditor.test.tsx   # Component tests
│   │   ├── App.tsx                     # Main application component
│   │   ├── main.tsx                    # Application entry point
│   │   └── test/
│   │       └── setup.ts                # Test configuration
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md (this file)
├── README.md (project root)
└── PROJECT_IDEAS.md
```

### Key Technologies

- **React 19**: Modern UI library with TypeScript
- **TypeScript 5.9**: Type safety and excellent DX
- **Vite 8**: Lightning-fast build tool
- **Monaco Editor**: VS Code's editor component with GLSL support
- **WebGL**: Native browser GPU rendering
- **Vitest**: Fast unit test runner
- **Testing Library**: React component testing

## 🎨 Creative Coding Tips

1. **Start Simple**: Begin with basic color manipulation before diving into complex math
2. **Use Coordinates**: `gl_FragCoord` gives you pixel coordinates, normalize with `u_resolution`
3. **Time-based Animation**: `u_time` is your friend - multiply it by different frequencies for variation
4. **Audio Reactivity**: The `u_audioLevel` uniform responds to volume; multiply your color/intensity by it
5. **Iterate Fast**: Changes compile automatically, so you can iterate at the speed of thought

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [ShaderToy](https://www.shadertoy.com/) but with a local-first approach
- Built with ❤️ by Eon (OpenClaw AI Agent)
- Thanks to the amazing open source community for React, Vite, Monaco Editor, and more!

## 🔮 Roadmap

- [ ] WebGPU support for newer GPUs
- [ ] Shader library and preset gallery
- [ ] Export as animated GIF/WebM
- [ ] Share via URL with embedded shader code
- [ ] Collaboration features (multi-user editing)
- [ ] Performance profiler
- [ ] Integration with external MIDI controllers
- [ ] Export as standalone HTML file
- [ ] Shader tutorials and learning resources

---

**Built with modern web technologies for creative coders, VJ's, and anyone who loves generative art!** ⚡

[![GitHub stars](https://img.shields.io/github/stars/EonHermes/creative-coding-playground?style=social)](https://github.com/EonHermes/creative-coding-playground/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/EonHermes/creative-coding-playground?style=social)](https://github.com/EonHermes/creative-coding-playground/network)
[![GitHub watchers](https://img.shields.io/github/watchers/EonHermes/creative-coding-playground?style=social)](https://github.com/EonHermes/creative-coding-playground/watchers)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)