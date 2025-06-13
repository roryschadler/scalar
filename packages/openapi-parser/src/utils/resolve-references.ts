import type { OpenAPI } from '@scalar/openapi-types'

import { ERRORS } from '@/configuration'
import type { AnyObject, ErrorObject, Filesystem, FilesystemEntry, ThrowOnErrorOption } from '@/types/index'
import { getEntrypoint } from './get-entrypoint'
import { getSegmentsFromPath } from './get-segments-from-path'
import { isObject } from './is-object'
import { makeFilesystem } from './make-filesystem'
import { CircularReferenceTracker } from './circular-reference-tracker'

// TODO: Add support for all pointer words
// export const pointerWords = new Set([
//   '$ref',
//   '$id',
//   '$anchor',
//   '$dynamicRef',
//   '$dynamicAnchor',
//   '$schema',
// ])

export type ResolveReferencesResult = {
  valid: boolean
  errors: ErrorObject[]
  schema: OpenAPI.Document
}

export type ResolveReferencesOptions = ThrowOnErrorOption & {
  /**
   * Fired when dereferenced a schema.
   *
   * Note that for object schemas, its properties may not be dereferenced when the hook is called.
   */
  onDereference?: (data: { schema: AnyObject; ref: string }) => void
  /**
   * Handle circular references mode
   * - `mark` (default): Mark circular references with isCircular but continue resolving
   * - `break`: Break resolution on circular references to prevent infinite recursion
   */
  circularReferenceMode?: 'mark' | 'break'
}

/**
 * Takes a specification and resolves all references.
 */
export function resolveReferences(
  // Just a specification, or a set of files.
  input: AnyObject | Filesystem,
  // Additional options to control the behaviour
  options?: ResolveReferencesOptions,
  // Fallback to the entrypoint
  file?: FilesystemEntry,
  // Errors that occurred during the process
  errors: ErrorObject[] = [],
): ResolveReferencesResult {
  // Detach from input
  const clonedInput = structuredClone(input)

  // Make it a filesystem, even if it’s just one file
  const filesystem = makeFilesystem(clonedInput)

  // Get the main file
  const entrypoint = getEntrypoint(filesystem)

  const finalInput = file?.specification ?? entrypoint.specification

  // Does it look like an OpenAPI document?
  if (!isObject(finalInput)) {
    if (options?.throwOnError) {
      throw new Error(ERRORS.NO_CONTENT)
    }

    return {
      valid: false,
      errors,
      schema: finalInput as OpenAPI.Document,
    }
  }

  // Recursively resolve all references
  dereference(
    finalInput,
    filesystem,
    file ?? entrypoint,
    new WeakSet(),
    errors,
    options,
    new CircularReferenceTracker(),
  )

  // Remove duplicats (according to message) from errors
  errors = errors.filter(
    (error, index, self) => index === self.findIndex((t) => t.message === error.message && t.code === error.code),
  )

  // Return the resolved specification
  return {
    valid: errors.length === 0,
    errors,
    schema: finalInput as OpenAPI.Document,
  }
}

/**
 * Resolves the circular reference to an object and deletes the $ref properties (in-place).
 */
function dereference(
  schema: AnyObject,
  filesystem: Filesystem,
  entrypoint: FilesystemEntry,
  // references to resolved object
  resolvedSchemas: WeakSet<object>,
  // error output
  errors: ErrorObject[],

  options?: ResolveReferencesOptions,
  tracker?: CircularReferenceTracker,
): void {
  if (schema === null || resolvedSchemas.has(schema)) {
    return
  }
  resolvedSchemas.add(schema)

  function resolveExternal(externalFile: FilesystemEntry) {
    dereference(externalFile.specification, filesystem, externalFile, resolvedSchemas, errors, options, tracker)
    return externalFile
  }

  while (schema.$ref !== undefined) {
    // Find the referenced content
    const ref = schema.$ref

    // Check for circular reference before entering
    const isCircular = tracker?.enter(ref) ?? false

    try {
      const resolved = resolveUri(ref, options, entrypoint, filesystem, resolveExternal, errors)

      // invalid
      if (typeof resolved !== 'object' || resolved === null) {
        break
      }

      // If this is a circular reference, mark it but preserve the $ref for UI
      if (isCircular) {
        schema.isCircular = true

        // If we're using 'break' mode, stop here to prevent infinite recursion
        if (options?.circularReferenceMode === 'break') {
          break
        }
      } else {
        // Only remove $ref if it's not circular, so UI can still access it
        delete schema.$ref
      }

      for (const key of Object.keys(resolved)) {
        if (schema[key] === undefined) {
          schema[key] = resolved[key]
        }
      }

      if (ref) {
        options?.onDereference?.({ schema, ref })
      }

      // In 'mark' mode, we continue resolving even with circular references
      // The isCircular flag will be used by the UI to handle display appropriately
    } finally {
      tracker?.exit()
    }
  }

  // Iterate over the whole object
  for (const value of Object.values(schema)) {
    if (typeof value === 'object' && value !== null) {
      dereference(value, filesystem, entrypoint, resolvedSchemas, errors, options, tracker)
    }
  }
}

/**
 * Resolves a URI to a part of the specification
 *
 * The output is not necessarily dereferenced
 */
function resolveUri(
  // 'foobar.json#/foo/bar'
  uri: string,
  options: ResolveReferencesOptions,
  // { filename: './foobar.json '}
  file: FilesystemEntry,
  // [ { filename: './foobar.json '} ]
  filesystem: Filesystem,

  // a function to resolve references in external file
  resolve: (file: FilesystemEntry) => FilesystemEntry,

  errors: ErrorObject[],
): AnyObject | undefined {
  // Ignore invalid URIs
  if (typeof uri !== 'string') {
    if (options?.throwOnError) {
      throw new Error(ERRORS.INVALID_REFERENCE.replace('%s', uri))
    }

    errors.push({
      code: 'INVALID_REFERENCE',
      message: ERRORS.INVALID_REFERENCE.replace('%s', uri),
    })

    return undefined
  }

  // Understand the URI
  const [prefix, path] = uri.split('#', 2)

  /** Check whether the file is pointing to itself */
  const isDifferentFile = prefix !== file.filename

  // External references
  if (prefix && isDifferentFile) {
    const externalReference = filesystem.find((entry) => {
      return entry.filename === prefix
    })

    if (!externalReference) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', prefix))
      }

      errors.push({
        code: 'EXTERNAL_REFERENCE_NOT_FOUND',
        message: ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', prefix),
      })

      return undefined
    }
    // $ref: 'other-file.yaml'
    if (path === undefined) {
      return externalReference.specification
    }

    // $ref: 'other-file.yaml#/foo/bar'
    // resolve refs first before accessing properties directly
    return resolveUri(`#${path}`, options, resolve(externalReference), filesystem, resolve, errors)
  }

  // Pointers
  const segments = getSegmentsFromPath(path)

  // Try to find the URI
  try {
    return segments.reduce((acc, key) => {
      return acc[key]
    }, file.specification)
  } catch (_error) {
    if (options?.throwOnError) {
      throw new Error(ERRORS.INVALID_REFERENCE.replace('%s', uri))
    }

    errors.push({
      code: 'INVALID_REFERENCE',
      message: ERRORS.INVALID_REFERENCE.replace('%s', uri),
    })
  }

  return undefined
}
