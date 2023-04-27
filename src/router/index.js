import Vue from 'vue'
import Router from 'vue-router'
import CutVidio from '@/components/CutVidio'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'CutVidio',
      component: CutVidio
    }
  ]
})
