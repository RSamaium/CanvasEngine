<template>
  <Layout v-if="!isHome" />
  <CustomHome v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import CustomHome from './components/CustomHome.vue'

const { Layout } = DefaultTheme
const { page } = useData()

const isHome = computed(() => page.value.relativePath === 'index.md')
</script> 