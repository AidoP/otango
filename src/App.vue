<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import User from '@/components/User.vue'
</script>

<template>
  <header>
    <div class="wrapper">
      <User />
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <!--RouterLink to="/about">About</RouterLink-->
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style>
@import '@/assets/base.css';
@media (hover: hover) {
}
@media (min-width: 1024px) {
}
</style>
