<script setup lang="ts">
  import { User, register, challenge } from './auth.ts'
</script>
<script lang="ts">
  export default {
    data() {
      return {
        name: "",
        contact: ""
      }
    }
  }
</script>

<template>
  <div id="auth">
    <img />
    <h1>{{User.get()}}</h1>
    <input v-model="name" placeholder="Name" />
    <input v-model="contact" placeholder="Contact" />
    <button @click="register(name, contact)">Register</button>
    <button @click="challenge()">Sign</button>
  </div>
</template>

<style scoped>
</style>
