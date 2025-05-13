<script setup lang="ts">
/**
 * API Reference Base
 * 
 * This will be the standard populated layout for the API Reference. 
 * No state mutation occurs in this component.  
 * 
 * This element may be used in an external app where the entire workspace state is handled 
 * by a wrapping SPA. 
 * 
 */

import type { ScalarApiReferenceConfig } from './config';


const props = defineProps<{
  config: ScalarApiReferenceConfig
  /** Pointer to the reactive scalar workspace object.  */
  getWorkspace: () => Record<string, any>
  /** Handler to run during SSR. Allows users to control workspace pre-fetching as needed. */
  onServerPrefetch: () => void
}>()



if (!props.getWorkspace) {
  throw new Error('getWorkspace is required')
}

// The getWorkspace function is a pointer to the workspace object and is only run once
// A functional pointer is used to avoid passing as a prop which has performance implications
const workspace = props.getWorkspace()

/** Before navigate we async resolve any missing docs */
// router.on('navigate', () => {
//   if(!document.resolved) resolve()
// })

/** On scroll we progressively fetch the operations */
// scrollWatch(() => {
//   // Resolve the next n operations as we scroll
//   if(!resolved) resolve('active-operation')
//   if(inView) setActiveOperation('active-operation')
// })

/** Option to preload everything in the background */
// if(config.preload) {
//   // background fetch all operations
// }

</script>
<template>
  <ApiReferenceLayout :mode="'modern'">
    <template #header>
      <ApiReferenceHeader :config="{ ...somePartialConfig }" :info="workspace.activeDoc.info" />
    </template>
    <template #sidebar>
      <ApiReferenceSidebar 
        :active="{ type, path}" 
        :config="{
          ...selectedConfigProps
        }" 
        :document="workspace.activeDoc"
        @update:document="emit('update:document', $event)"
        @navigate="emit('navigate', $event)">
        <template #top>
          <ApiReferenceSearch />
        </template>
        <template #footer>
          <ApiReferenceSidebarFooter />
        </template>
      </ApiReferenceSidebar>
    </template>
    <template #description>
      <!-- Description: Each section has a id hash like #description/section-name -->
      <ApiReferenceDescription :config="config" :info="workspace.activeDoc.info" />
      <!-- Authentication -->
      <ApiReferenceAuthentication 
        :servers="workspace.activeDoc.servers"
        :security="workspace.activeDoc.security"
        @update:server="domEmit('update:server', $event)" 
        @update:auth="emit('update:auth', $event)" 
        @update:client="emit('update:client', $event)" />
    </template>
    <template #operations>
      <template v-for="path in workspace.activeDoc.paths" :key="operation.path">
        <template v-for="method in operation" :key="`${operation.path}:${method.method}`">
          <ApiReferenceOperation" 
            :config="{ ...partialConfigAsNeeded }" 
            :operation="method"
            :activeAuth="workspace.activeDoc['x-scalar-active-auth']"
            @update:auth="emit('update:auth', $event)"
            @open-client="emit('open-client', $event)"
            @update:client="emit('update:client', $event)" />
        </template>
      </tempate>
    </template>
    <template #models>
    </template>   
    <template #webhooks>
    </template>
    <!-- Client instance that will just work with the active properties from the workspace -->
    <ApiClient 
      :active-operation="workspace['x-scalar-active-operation']" 
      :active-document="workspace['x-scalar-active-document']" />
  </ApiReferenceLayout>
</template>