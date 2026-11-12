import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      // Статичний сегмент 'new' має пріоритет над динамічним ':id' — router ранжує маршрути сам
      path: '/sets/new',
      name: 'set-create',
      component: () => import('../views/SetEditorView.vue'),
    },
    {
      path: '/sets/:id/edit',
      name: 'set-edit',
      component: () => import('../views/SetEditorView.vue'),
      props: true,
    },
    {
      // :id — динамічний сегмент. /sets/abc → route.params.id === 'abc'
      // props: true — router передасть params у компонент як props (id="abc")
      path: '/sets/:id',
      name: 'set',
      component: () => import('../views/SetView.vue'),
      props: true,
    },
    {
      path: '/sets/:id/flashcards',
      name: 'study-flashcards',
      component: () => import('../views/FlashcardsView.vue'),
      props: true,
    },
    {
      path: '/sets/:id/learn',
      name: 'study-learn',
      component: () => import('../views/LearnView.vue'),
      props: true,
    },
    {
      path: '/sets/:id/match',
      name: 'study-match',
      component: () => import('../views/MatchView.vue'),
      props: true,
    },
    {
      path: '/sets/:id/test',
      name: 'study-test',
      component: () => import('../views/TestView.vue'),
      props: true,
    },
    {
      path: '/sets/:id/review',
      name: 'study-review',
      component: () => import('../views/ReviewView.vue'),
      props: true,
    },
    {
      // Будь-який невідомий URL → сторінка 404
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
  // Після переходу на нову сторінку прокручувати вгору
  scrollBehavior: () => ({ top: 0 }),
})

export default router
