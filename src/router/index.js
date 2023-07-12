import Vue from 'vue'
import VueRouter from 'vue-router'
import test from '../views/test.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'test',
    meta:{
      title:'测试页面'
    },
    component: test,
  },
]

const router = new VueRouter({
  mode: 'history',
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
