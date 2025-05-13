<script setup lang="ts">
import { ApiReference } from '../src'

/** Create workspace should run validation on initial load. Errors can be output */
const workspace = createWorkspace({})

// If you don't want to await on page load then preprocessing a workspace blog using the tooling is required
// The createWorkspace will accept a complete workspace JSON blob. Document dereferencing and validation is expected to be completed
onBeforeMount(async () => {
  await workspace.addDocument('./openapi.json')
})

const config = {}
</script>
<template>
  <ApiReference
    :config="config"
    :getWorkspace="() => workspace" />
</template>
