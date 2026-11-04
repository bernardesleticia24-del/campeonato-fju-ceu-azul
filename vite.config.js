import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        inicio: 'index.html',
        admin: 'admin.html',
        equipes: 'equipes.html',
        partidas: 'partidas.html',
        classificacao: 'classificacao.html'
      }
    }
  }
}) 