import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createApp } from 'vue'
import OperationBlock from './components/OperationBlock.vue'

export type OperationBlockConfiguration = {
  store: WorkspaceStore
  document: string
  pointer: string[]
}

export function createOperationBlock(
  elementOrSelector: HTMLElement | string,
  configuration: OperationBlockConfiguration,
) {
  console.log('createOperationBlock', elementOrSelector, configuration)
  // Get element to mount to
  const element = typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector

  if (!element) {
    throw new Error(`HTML Element not found: ${elementOrSelector}`)
  }

  // Mount Vue App
  const app = createApp(OperationBlock, configuration)

  app.mount(element)
}
