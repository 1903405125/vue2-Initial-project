const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  assetsDir: 'static',
  parallel: false,
  /*
      下方配置需要注意！
      如果你的项目中引用了静态文件比如图片路径是   ./ 或者../ 
      打包时候需要求改为 ./ 如果没有人用任何非网络路径的就默认 / 就ok了
  */
  publicPath: './', 
})
