import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../components/login.vue'
import Home from '../components/home.vue'

Vue.use(VueRouter)

const routes = [
  { path:'/', redirect:'/login'},
  { path:'/login', component: Login},
  { path:'/home', component: Home}
]

const router = new VueRouter({
  routes
})

//挂载路由导航守卫
router.beforeEach((to,from,next)=>{
  //to代表将要访问的路径
  //from代表从哪个路经跳转而来
  //next是一个函数表示放行
  // next() 放行   next('/login') 强制跳转
  if(to.path==='/login') return next()
  // 获取token
  const tokenStr= window.sessionStorage.getItem('token')
  if(!tokenStr) return next('/login') //未登录状态强制跳转
  next()
})

export default router
