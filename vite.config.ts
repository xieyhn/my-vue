import { defineConfig } from 'vite'

const port = 5555

export default defineConfig({
  server: {
    port,
    strictPort: true,
    proxy: {
      '^/(?!packages|@|node_modules)': `http://localhost:${port}/packages/examples/src/`
    }
  }
})