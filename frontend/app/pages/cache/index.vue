<script setup lang="ts">
// On appelle useFetch directement, en contournant vos composables pour ce test
// !!! Assurez-vous que l'URL est la bonne !!!
const { data, pending, error, status } = await useGetUsers();
</script>

<template>
  <div>
    <h1>Page de Test Direct</h1>
    <div v-if="pending">Chargement...</div>
    <div v-else-if="error">
      <h2>Erreur détectée :</h2>
      <pre>{{ error }}</pre>
    </div>
    <div v-else>
      <h2>Données reçues :</h2>
      <pre>{{ data }}</pre>
    </div>
  </div>
</template>