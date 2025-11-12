import type { UserConfig } from 'vite';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { createViteProxy } from './build/config/index';
import createVitePlugins from './build/plugins/index';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from 'unplugin-vue-components/resolvers';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }): UserConfig => {
  const { UNI_PLATFORM } = process.env;
  const env = loadEnv(mode, fileURLToPath(new URL('./env', import.meta.url)));
  const isBuild = process.env.NODE_ENV === 'production';

  return {
    envDir: './env',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: Number.parseInt(env.VITE_APP_PORT, 10),
      hmr: true,
      host: true,
      open: true,
      proxy: createViteProxy(env),
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    plugins: [
      // 原有插件
      ...createVitePlugins(isBuild),
      
      // 新增 Vant 按需引入
      Components({
        resolvers: [VantResolver()],
        // 其他配置（可选）
        dts: true, // 生成组件类型声明文件
        include: [/\.vue$/, /\.vue\?vue/], // 处理的文件类型
      })
    ],
    esbuild: {
      drop: JSON.parse(env.VITE_DROP_CONSOLE) ? ['console', 'debugger'] : [],
    },
  };
});