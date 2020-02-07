import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../components/login.vue'
import Home from '../components/home.vue'
import Welcome from '../components/welcome.vue'
import Users from '../components/user/users.vue'
import Roles from '../components/role/roles.vue'
import Rights from '../components/role/rights.vue'
import Orders from '../components/order/orders.vue'
import Goods from '../components/goods/goods.vue'
import Add from '../components/goods/add.vue'
import Params from '../components/goods/params.vue'
import Categories from '../components/goods/categories.vue'
import Reports from '../components/data/reports.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  {
    path: '/home',
    component: Home,
    redirect: '/welcome',
    children: [
      { path: '/welcome', component: Welcome },
      { path: '/users', component: Users },
      { path: '/roles', component: Roles },
      { path: '/rights', component: Rights },
      { path: '/orders', component: Orders },
      { path: '/goods', component: Goods },
      { path: '/goods/add', component: Add },
      { path: '/params', component: Params },
      { path: '/categories', component: Categories },
      { path: '/reports', component: Reports }
    ]
  }
]

const router = new VueRouter({
  routes
})

//挂载路由导航守卫
router.beforeEach((to, from, next) => {
  //to代表将要访问的路径
  //from代表从哪个路经跳转而来
  //next是一个函数表示放行
  // next() 放行   next('/login') 强制跳转
  if (to.path === '/login') return next()
  // 获取token
  const tokenStr = window.sessionStorage.getItem('token')
  if (!tokenStr) return next('/login') //未登录状态强制跳转
  next()
})

export default router
