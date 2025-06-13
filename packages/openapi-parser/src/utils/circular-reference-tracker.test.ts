import { describe, expect, it } from 'vitest'
import { CircularReferenceTracker } from './circular-reference-tracker'

describe('CircularReferenceTracker', () => {
  it('should detect simple circular reference', () => {
    const tracker = new CircularReferenceTracker()

    expect(tracker.enter('Earth')).toBe(false)
    expect(tracker.enter('Moon')).toBe(false)
    expect(tracker.enter('Earth')).toBe(false)
    tracker.exit()
    tracker.exit()
    tracker.exit()

    // Now if we visit the same path again, it should be circular
    expect(tracker.enter('Earth')).toBe(true)
    expect(tracker.isCircular('Earth')).toBe(true)

    tracker.exit()
  })

  it('should detect complex circular reference', () => {
    const tracker = new CircularReferenceTracker()

    expect(tracker.enter('MilkyWay')).toBe(false)
    expect(tracker.enter('SolarSystem')).toBe(false)
    expect(tracker.enter('Earth')).toBe(false)
    expect(tracker.enter('Moon')).toBe(false)
    expect(tracker.enter('MilkyWay')).toBe(false)
    tracker.exit()
    tracker.exit()
    tracker.exit()
    tracker.exit()
    tracker.exit()

    // Now if we visit any previously visited path, it should be circular
    expect(tracker.enter('MilkyWay')).toBe(true)
    expect(tracker.isCircular('MilkyWay')).toBe(true)

    tracker.exit()
  })

  it('should handle non-circular paths', () => {
    const tracker = new CircularReferenceTracker()

    expect(tracker.enter('MilkyWay')).toBe(false)
    expect(tracker.enter('SolarSystem')).toBe(false)
    expect(tracker.enter('Earth')).toBe(false)
    tracker.exit()
    expect(tracker.enter('Mars')).toBe(false)
    tracker.exit()
    expect(tracker.enter('Jupiter')).toBe(false)

    tracker.exit()
    tracker.exit()
    tracker.exit()
  })

  it('should track current path correctly', () => {
    const tracker = new CircularReferenceTracker()

    tracker.enter('Universe')
    expect(tracker.getCurrentPath()).toBe('Universe')

    tracker.enter('Galaxy')
    expect(tracker.getCurrentPath()).toBe('Universe/Galaxy')

    tracker.enter('SolarSystem')
    expect(tracker.getCurrentPath()).toBe('Universe/Galaxy/SolarSystem')

    tracker.exit()
    expect(tracker.getCurrentPath()).toBe('Universe/Galaxy')

    tracker.exit()
    expect(tracker.getCurrentPath()).toBe('Universe')

    tracker.exit()
    expect(tracker.getCurrentPath()).toBe('')
  })

  it('should identify circular paths after detection', () => {
    const tracker = new CircularReferenceTracker()

    // First visit - not circular
    tracker.enter('Earth')
    tracker.enter('Moon')
    tracker.exit()
    tracker.exit()

    // Second visit to same path - should be circular
    expect(tracker.enter('Earth')).toBe(true)
    expect(tracker.isCircular('Earth')).toBe(true)

    tracker.exit()
  })

  it('should handle multiple separate circular references', () => {
    const tracker = new CircularReferenceTracker()

    // First path
    tracker.enter('Earth')
    tracker.enter('Moon')
    tracker.exit()
    tracker.exit()

    // Different path
    tracker.enter('Mars')
    tracker.enter('Phobos')
    tracker.exit()
    tracker.exit()

    // Revisit first path - circular
    expect(tracker.enter('Earth')).toBe(true)
    expect(tracker.isCircular('Earth')).toBe(true)
    tracker.exit()

    // Revisit second path - circular
    expect(tracker.enter('Mars')).toBe(true)
    expect(tracker.isCircular('Mars')).toBe(true)
    tracker.exit()
  })

  it('should handle same planet in different contexts', () => {
    const tracker = new CircularReferenceTracker()

    tracker.enter('MilkyWay')
    tracker.enter('Earth')
    tracker.exit()
    tracker.enter('AndromedaGalaxy')
    tracker.enter('Earth')

    expect(tracker.getCurrentPath()).toBe('MilkyWay/AndromedaGalaxy/Earth')

    tracker.exit()
    tracker.exit()
    tracker.exit()
  })
})
