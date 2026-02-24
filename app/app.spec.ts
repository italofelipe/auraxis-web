import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import App from './app.vue'

describe('App bootstrap', () => {
  it('renderiza o shell base da aplicação', () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          NuxtRouteAnnouncer: true,
          NuxtWelcome: true,
        },
      },
    })

    expect(wrapper.html()).toContain('nuxt-route-announcer-stub')
    expect(wrapper.html()).toContain('nuxt-welcome-stub')
  })
})
