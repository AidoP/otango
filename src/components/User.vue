<script setup lang="ts">
  import { ref } from 'vue'
  import { user_store, User } from '../composables/auth'
  const user = user_store()

  const new_name = ref("");
  const new_contact = ref("");
  const import_data = ref("");

  const failure_message = ref();

  const enum Form {
    New,
    Existing
  }
  const form = ref();
</script>

<template>
  <div id="user" class="floating">
    <div v-if="user.user">
      <img id="profile_image" />
      <h1>{{user.user.name}}</h1>
    </div>
    <span v-else>
      <img id="profile_image" />
      <h1>Guest</h1>
    </span>
    <div v-if="user.user">
      <p>{{user.user.contact}}</p>
      <button @click="user.logout()">Logout</button>
      <button @click="">Export Key</button>
    </div>
    <div v-else>
      <button @click="form = Form.New">New User</button>
      <button @click="form = Form.Existing">Existing User</button>
      <p v-if="failure_message">{{failure_message}}</p>
      <div v-if="form == Form.New">
        <input v-model="new_name" placeholder="Name" />
        <input v-model="new_contact" placeholder="Contact" />
        <button @click="user.register(new_name, new_contact).catch(e => failure_message = e)">Register</button>
      </div>
      <div v-else-if="form == Form.Existing">
        <input v-model="new_name" placeholder='{ "name": "...", "contact": null, "private_key": "...", "public_key": "..." }' />
      <button @click="user.from(import_data)">Import</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  #user {
    right: 1em;
    top: 1em;
  }
  #profile_image {
    display: inline-block;
    width: 1em;
    height: 1em;
  }
</style>
