import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React核心库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI和动画库
          'ui-vendor': ['framer-motion', 'lucide-react', 'recharts'],
          
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          
          // Excel导出库（按需加载）
          'excel': ['xlsx', 'xlsx-js-style', 'papaparse'],
          
          // PDF生成库（按需加载）
          'pdf': ['jspdf', 'jspdf-autotable'],
          
          // 其他工具库
          'utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // 提高chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
})
