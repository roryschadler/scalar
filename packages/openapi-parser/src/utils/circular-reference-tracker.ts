export class CircularReferenceTracker {
  private visitedPaths: Set<string> = new Set()
  private currentPath: string[] = []
  private circularPaths: Set<string> = new Set()

  /**
   * Enter a new path
   * @returns Whether the path is circular
   */
  enter(path: string): boolean {
    this.currentPath.push(path)
    const fullPath = this.currentPath.join('/')

    if (this.visitedPaths.has(fullPath)) {
      this.circularPaths.add(fullPath)
      return true
    }

    this.visitedPaths.add(fullPath)
    return false
  }

  /**
   * Exit the current path
   */
  exit() {
    this.currentPath.pop()
  }

  /** Check if a path is circular */
  isCircular(path: string): boolean {
    return this.circularPaths.has(path)
  }

  /** Get the current path in order to report circular references */
  getCurrentPath(): string {
    return this.currentPath.join('/')
  }
}
