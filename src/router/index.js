import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'main',
    meta:{
      title:'倒计时'
    },
    component: ()=>import('../views/main.vue'),
  },
]

const router = new VueRouter({
  // 临时改为哈希，因为需要本地打开
  mode: 'hash',
  routes
})

router.beforeEach((to, from, next) => {
  /* 路由发生变化修改页面title */
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
})

export default router
