<script setup lang="ts">
import { user, register, login } from './auth.ts'
</script>

<template>
  <div id="auth">
    <img />
    <h1>{{user.name}}</h1>
    <button @click="register()">Register</button>
  </div>
</template>

<style scoped>
</style>
