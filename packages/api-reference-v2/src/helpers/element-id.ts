/** Generator functions to create unique HTML element IDs  */
export const elementId = {
  path: (path: string) => `${path}`,
  operation: (path: string, method: string) => `${path}/${method}`,
}
