cerios.schedule.app.version


安装依赖：pnpm install

点击菜单中的运行-运行到浏览器，或teriminal输入pnpm run dev:h5 进行浏览器预览


主要看src文件夹 和pc端的前端类似


src/main.ts 的功能为

  初始化 Vue 应用实例
  
  全局挂载插件（如 Pinia、Vant 等）
  
  配置 SSR（服务端渲染）相关逻辑
  

src/App.vue 的功能为

  定义应用的全局布局（如导航栏、底部 Tab 等）
  
  监听应用生命周期（启动、显示、隐藏）
  
  引入全局样式（如 UI 框架样式、自定义公共样式）
  

src/pages.json 的功能为

  定义页面路由 (path)
  
  配置全局窗口样式 (navigationStyle)
  
  自定义底部 Tab 栏 (tabBar)
  

src/manifest.json 跨平台开发中的核心配置文件

  最下面一栏源码视图改
  
  
*** 注意 ***

src/utils/httpClient.ts 为 pc端前端的 src/utils/request.js

src/pages 为 pc端前端的 src/views


移动端 src/utils/axios.ts和pc端的不一致

ts文件定义了 API 返回结构 如果结构和API不一致可能报错


api我都用js写的
