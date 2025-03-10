import { describe, expect, it } from 'vitest'

import { apiReference, customTheme } from './nestJSApiReference.ts'

const DOCUMENT_URL = 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'
const CUSTOM_CDN_URL = 'https://fastly.jsdelivr.net/npm/@scalar/api-reference'

describe('apiReference', () => {
  // Test cases
  describe('Express', () => {
    it('renders API reference with default configuration', () => {
      const express = createExpress()

      const handler = apiReference({ spec: { url: DOCUMENT_URL } })

      express.render(handler)

      expect(express.getResponseBody()).toContain(DOCUMENT_URL)
    })

    it('renders API reference with custom CDN', () => {
      const express = createExpress()

      const handler = apiReference({
        spec: { url: DOCUMENT_URL },
        cdn: CUSTOM_CDN_URL,
      })

      express.render(handler)

      expect(express.getResponseBody()).toContain(DOCUMENT_URL)
    })
  })

  describe('Fastify', () => {
    it('renders API reference', () => {
      const fastify = createFastify()

      const handler = apiReference({
        spec: { url: DOCUMENT_URL },
        withFastify: true,
      })

      fastify.render(handler)

      expect(fastify.getResponseBody()).toContain(DOCUMENT_URL)
    })
  })

  describe('Configuration', () => {
    it('uses default configuration', () => {
      const express = createExpress()
      const handler = apiReference({ spec: { url: DOCUMENT_URL } })

      express.render(handler)

      const response = express.getResponseBody()
      expect(response).toContain('&quot;_integration&quot;:&quot;nestjs&quot;')
    })

    it('merges custom configuration with defaults', () => {
      const express = createExpress()
      const customConfig = {
        spec: { url: DOCUMENT_URL },
        theme: 'kepler',
      } as const

      const handler = apiReference(customConfig)
      express.render(handler)

      const response = express.getResponseBody()
      expect(response).toContain('&quot;_integration&quot;:&quot;nestjs&quot;')
      expect(response).toContain('&quot;theme&quot;:&quot;kepler&quot;')
    })
  })

  describe('Theme', () => {
    it('includes custom theme in the HTML output', () => {
      const express = createExpress()
      const handler = apiReference({ spec: { url: DOCUMENT_URL } })

      express.render(handler)

      const response = express.getResponseBody()
      expect(response).toContain(customTheme)
      expect(response).toContain('.light-mode')
      expect(response).toContain('.dark-mode')
    })
  })

  describe('Response types', () => {
    it('sets correct content type for Express', () => {
      const express = createExpress()
      const handler = apiReference({ spec: { url: DOCUMENT_URL } })

      express.render(handler)

      expect(express.getContentType()).toBe('text/html')
    })

    it('sets correct content type for Fastify', () => {
      const fastify = createFastify()
      const handler = apiReference({
        spec: { url: DOCUMENT_URL },
        withFastify: true,
      })

      fastify.render(handler)

      expect(fastify.getHeaders()['Content-Type']).toBe('text/html')
    })
  })
})

// Test helpers
function createExpress() {
  let sentHtml = ''
  let contentType = ''
  const mockRes = {
    type: (type: string) => {
      contentType = type
      return mockRes
    },
    send: (html: string) => {
      sentHtml = html
    },
  }

  return {
    render: (handler: any) => handler({} as any, mockRes as any),
    getResponseBody: () => sentHtml,
    getContentType: () => contentType,
  }
}

function createFastify() {
  let sentHtml = ''
  let headers: Record<string, string> = {}
  const mockRes = {
    writeHead: (status: number, responseHeaders: Record<string, string>) => {
      headers = responseHeaders
    },
    write: (html: string) => {
      sentHtml = html
    },
    end: () => {},
  }

  return {
    render: (handler: any) => handler({} as any, mockRes as any),
    getResponseBody: () => sentHtml,
    getHeaders: () => headers,
  }
}
