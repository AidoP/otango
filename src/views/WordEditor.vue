<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { Word, WordReading, Definition } from '../composables/word'

  const route = useRoute()
  const router = useRouter()
  const word = ref(new Word(route.params.word as string))
  const submit = function () {
    router.replace({ path: `/word/${encodeURIComponent(word.value.word)}` });
    word.value.set();
  }
</script>

<template>
  <input v-model="word.word" placeholder="Word" />
  <div v-for="[index, reading] of word.readings.entries()">
    <div>
      <button @click="word.readings.splice(index, 1)">Remove</button>
      <input v-model="reading.full" placeholder="Reading" />
      <input placeholder="Accent" disabled />
    </div>
    <div v-for="[index, definition] of reading.definitions.entries()">
      <input v-model="definition.definition" placeholder="Definition"/>
      <button @click="reading.definitions.splice(index, 1)">Remove</button>
    </div>
    <button @click="reading.definitions.push(new Definition(''))">Add Definition</button>
  </div>
  <button @click="word.readings.push(new WordReading('', ''))">Add Reading</button>
  <button @click="submit()">Submit</button>
</template>

<style scoped>
</style>