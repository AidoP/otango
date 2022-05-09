<script setup lang="ts">
  import { ref } from 'vue'
  import { Word, WordReading, Definition } from '../composables/word'

  const props = defineProps({
    word: String
  })
  const word = await Word.get(props.word!.toString())
</script>

<template>
  <h1>{{word.word}}</h1>
  <div v-for="tag of word.tags">
    <p>{{tag.tag}}</p>
  </div>
  <div v-for="reading of word.readings">
    <!-- TODO: furigana from readings -->
    <h2>{{reading.full}}</h2>
    <!--p>{{reading.accent}}</p-->
    <div v-for="definition of reading.definitions">
      <p>{{definition.definition}}</p>
    </div>
  </div>
</template>

<style scoped>
</style>