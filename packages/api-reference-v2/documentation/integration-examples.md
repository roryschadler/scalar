# Integration Example Interfaces


## ESM

```html

<script>
import { createApiReference, createWorkspace } from '@scalar/api-reference'

/** In ESM mode we validate + dereference anything injected. Client code gets a fully resolved workspace. */
const workspace: {
  state: ScalarWorkspace
  ...workspaceMethods
} = createWorkspaceStore({
  // ...state overrides
  'x-scalar-dark-mode': true,
})

await workspace.addDocument('https://galaxy.scalar.com/openapi.json')
await workspace.addDocument('./openapi.json')


const app = createApiReference({
  config: props.config,
  workspace: () => workspace,
}).mount(document.body)

// ------------------------------------------------------------------

setTimeout(() => {
  workspace.addDocument('galaxy', 'https://api.galaxy.com/v1/schema.json')
}, 5000)

document.getElementById('toggle')?.addEventListener('click', () => {
  workspace.toggleDarkMode()
})

</script>

```

## SSR Integration

Fastify style example

```ts
const workspace = createServerWorkspace({
  'x-scalar-dark-mode': true,
  baseServerUrl: '',
  documents: {},
})

/** Deferences and chunks the document into the store */
workspace.addDocument('https://api.galaxy.com/v1/schema.json')
/** Works with local filepaths or remote URLs */
workspace.addDocument('./some-doc.json')

const sparse = workspace.getJSON()

// On initial page load we need to provision the CDN vue app. After intiial load the client side router kicks in
app.get('./scalar/active-document-name', () => {
  const html = `
  ...
  const workspace = createWorkspace(${workspace.getJSON({ resolve: 'active-document-name' })})
  const app = createApiReference({
  config: props.config,
    workspace,
  }).mount(document.body)
  `
})

// #ref resolution paths. Client side code will attempt to resolve JSON blobs from this endpoint
app.get('./scalar/assets/:document-name', () => {
  return workspace.documents('document-name').toJSON()
})


```