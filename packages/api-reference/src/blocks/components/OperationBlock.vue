<script setup lang="ts">
import type { WorkspaceStore } from '@scalar/workspace-store/client'

// import { Operation } from '@/features/Operation'

/**
 * This component should stay lean and do the minimum amount of work to
 * use the actual components from @scalar/api-reference.
 */
defineProps<{
  document: any
  path: string
  method: string
}>()
</script>

<template>
  <div class="debug">
    <h2>&lt;OperationBlock/&gt;</h2>
    <div><strong>OpenAPI document:</strong></div>
    <pre><code>{{ JSON.stringify(document, null, 2) }}</code></pre>
    <div><strong>Operation:</strong></div>
    <pre><code>{{ method.toLocaleUpperCase() }} {{ path }}</code></pre>
    <!-- <div>&lt;Operation/&gt;: <Operation /></div> -->
  </div>
</template>

<style scoped>
.debug {
  border: 1px solid black;
  padding: 0.25rem 1rem;
  font-family: monospace;
}
</style>
