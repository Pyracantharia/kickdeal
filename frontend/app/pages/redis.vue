<script setup lang="ts">
const { data, pending, error }: { data: any; pending: boolean; error: any } = await useFetch('https://kickdeal.store/api/redis-test', {
  server: false
});
</script>

<template>
  <div>
    <h1>Test Redis Cache</h1>
    <div v-if="pending">Chargement...</div>
    <div v-else-if="error">
      <h2>Erreur :</h2>
      <pre>{{ error }}</pre>
    </div>
    <div v-else>
      <h2>Résultat :</h2>
      <pre>{{ data }}</pre>
    </div>
  </div>
</template>