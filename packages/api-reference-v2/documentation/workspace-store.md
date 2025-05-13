# Node Pipeline for Reference Workspace Store

## Workspace Definition

JSON format for the workspace. The documents will have all the operations and components as $refs in the server store.
Client side these $refs will be incrementally replaced with their resolved values.

```json
{
  "$schema": "https://cdn.scalar.com/schemas/workspace/v1.json",
  "x-scalar-dark-mode": true,
  "x-scalar-theme": "solarized",
  "x-scalar-active-client": "curl",
  "documents": {
    "my-api": {
      "x-scalar-active-auth": {},
      "x-scalar-active-server": "document-server-selection",
      ...openapiDocument,
      "operations": {
        "some-path": {
          "get": {
            // For SSR
            "$ref": "https://<base-url>#/my-api/operations/some-path/get",
            // For static output
            "$ref": "<output-dir>/chunks/my-api/operations/some-path/get.json/#"
          }
        }
      },
    },
    "my-second-api": {
      ...openapiDocument
    },
  },
}
```

JSON format for the server assets
```json
{
  "$schema": "https://cdn.scalar.com/schemas/workspace-assets/v1.json",
  "my-api": {
    "components": {},
    "operations": {},
  },
  "my-second-api": {
    "components": {},
    "operations": {},
  }
}
```

## SSG -----------------------------------------------

Run as a vite plugin or as a preload script

```ts
const store = createServerStore({
  directory: 'assets',
  mode: 'static',
  documents: [
    {
      document,
      name: 'my-api',
    },
    {
      docucment: document2,
      name: 'my-second-api
    }
  ]
})

//OR

await store.addDocument(document, {
  name: 'my-openapi'
})

await store.addDocument(document2, {
  name: 'my-second-api'
})


/** Outputs a scalar-workspace.json and all chunks as micro json files with relative paths */
await store.generateWorkspaceChunks()
```

Inside of your application:

```ts
// Will bootstrap the store with spares documents for each available document 
// All operations/components etc can be resolved as needed
const store = createClientStore('https://my-ssr-api.com/<base-integration-path>/workspace.json')
```

## SSR -----------------------------------------------

```ts
const store = createServerStore({
  directory: 'assets',
  mode: 'ssr' | 'static',
  documents: [
    {
      document,
      name: 'my-api',
    },
    {
      docucment: document2,
      name: 'my-second-api
    }
  ]
})

//OR

await store.addDocument(document, {
  name: 'my-openapi'
})

await store.addDocument(document2, {
  name: 'my-second-api'
})https://docs.stripe.com/api
