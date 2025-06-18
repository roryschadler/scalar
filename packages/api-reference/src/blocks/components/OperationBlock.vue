<script setup lang="ts">
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { Operation } from '@/features/Operation'

/**
 * This component should stay lean and do the minimum amount of work to
 * use the actual components from @scalar/api-reference.
 */
defineProps<{
  store: WorkspaceStore
  document: string
  pointer: string[]
}>()
</script>

<template>
  <div>OperationBlock: ✅</div>
  <div>OpenAPI document: {{ store.workspace.documents[document] }}</div>
  <div>document: {{ document }}</div>
  <div>pointer: {{ pointer }}</div>
  <div>&lt;Operation/&gt;: <Operation /></div>
</template>
