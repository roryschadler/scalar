import { reactive } from 'vue'

/** Some properties may be added for search support (such as description) */
type Operation = { $ref: string; description?: string } | Record<string, unknown>

/** Document specific state exists as x-scalar-* properties */
type WorkspaceDocument = {
  'x-scalar-active-operation': string
  'x-scalar-active-auth': string
  'x-scalar-active-server': string
  paths: Record<string, Record<string, Operation>>
}

type Workspace = {
  'x-scalar-active-snippet': string
  'x-scalar-active-document': string
  'x-scalar-dark-mode': boolean
  documents: Record<string, WorkspaceDocument>
}

export const workspace = reactive<Workspace & { activeDocument: WorkspaceDocument }>({
  'x-scalar-active-document': 'galaxy',
  'x-scalar-dark-mode': true,
  'x-scalar-active-client': 'curl',
  documents: {
    'galaxy': {
      'x-scalar-active-operation': 'planets/get',
      'x-scalar-active-auth': 'apiKey',
      'x-scalar-active-server': '',
      paths: {
        planets: {
          get: { $ref: 'planets/get' },
          post: {},
        },
      },
    },
    'galaxy-next': {
      $ref: 'https://my-api.com/v1/schema.json',
      status: 'loading' | 'error',
    },
  },
  get activeDocument() {
    return this.documents[this['x-scalar-active-document']]
  },
})

export const mutate = {
  setActiveDocument(name: string) {
    workspace['x-scalar-active-document'] = name
  },
  setActiveOperation(name: string) {
    workspace.activeDocument['x-scalar-active-operation'] = name
  },
  setActiveAuth(name: string) {
    workspace.activeDocument['x-scalar-active-auth'] = name
  },
}
