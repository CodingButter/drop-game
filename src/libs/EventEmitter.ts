/**
 * Type for listener functions.
 * T is an array of argument types that the listener accepts.
 */
type Listener<T extends any[]> = (...args: T) => void

/**
 * A fully-featured type-safe event emitter.
 *
 * @example
 * // Define your event map
 * type MyEvents = {
 *   'data': [string, number],  // Event with string and number args
 *   'end': [],                 // Event with no args
 *   'error'?: [Error],         // Optional error event
 * };
 *
 * // Create event emitter instance
 * const emitter = new EventEmitter<MyEvents>();
 *
 * // Type-safe event handling
 * emitter.on('data', (data, count) => {
 *   console.log(`Received ${data} (${count} times)`);
 * });
 *
 * // Type-safe event emission
 * emitter.emit('data', 'hello', 5);
 */
export default class EventEmitter<EventMap extends Record<string, any[]>> {
  /**
   * Storage for event listeners with metadata.
   * Each listener is stored with a flag indicating if it's a 'once' listener.
   */
  private eventListenersMap = new Map<
    keyof EventMap,
    Array<{
      fn: Listener<any>
      once: boolean
    }>
  >()

  /**
   * The maximum number of listeners allowed per event before a warning is issued.
   */
  private maxListeners: number = 10

  /**
   * Registers a listener for the specified event.
   */
  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    this.addListener(event, listener, false)
    return this
  }

  /**
   * Adds a one-time listener for the specified event.
   */
  once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    this.addListener(event, listener, true)
    return this
  }

  /**
   * Internal method to add a listener with metadata.
   */
  private addListener<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
    once: boolean
  ): void {
    const eventListeners = this.eventListenersMap.get(event) || []

    if (eventListeners.length >= this.maxListeners) {
      console.warn(
        `MaxListenersExceededWarning: Possible memory leak detected. ` +
          `${eventListeners.length} ${String(event)} listeners added.`
      )
    }

    eventListeners.push({ fn: listener, once })
    this.eventListenersMap.set(event, eventListeners)
  }

  /**
   * Removes the specified listener from the specified event.
   */
  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    const eventListeners = this.eventListenersMap.get(event)

    if (eventListeners) {
      const index = eventListeners.findIndex((l) => l.fn === listener)
      if (index !== -1) {
        eventListeners.splice(index, 1)

        if (eventListeners.length === 0) {
          this.eventListenersMap.delete(event)
        } else {
          this.eventListenersMap.set(event, eventListeners)
        }
      }
    }

    return this
  }

  /**
   * Alias for off method.
   */
  removeListener<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    return this.off(event, listener)
  }

  /**
   * Removes all listeners for the specified event or all events.
   */
  removeAllListeners<K extends keyof EventMap>(event?: K): this {
    if (event !== undefined) {
      this.eventListenersMap.delete(event)
    } else {
      this.eventListenersMap.clear()
    }

    return this
  }

  /**
   * Returns the number of listeners for the specified event.
   */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.eventListenersMap.get(event)?.length || 0
  }

  /**
   * Returns a copy of the array of listeners for the specified event.
   */
  listeners<K extends keyof EventMap>(event: K): Array<Listener<EventMap[K]>> {
    const eventListeners = this.eventListenersMap.get(event) || []
    return eventListeners.map((l) => l.fn as Listener<EventMap[K]>)
  }

  /**
   * Returns a copy of the array of listeners for the specified event, including metadata.
   */
  rawListeners<K extends keyof EventMap>(
    event: K
  ): Array<{
    fn: Listener<EventMap[K]>
    once: boolean
  }> {
    const eventListeners = this.eventListenersMap.get(event) || []
    return eventListeners.map((l) => ({
      fn: l.fn as Listener<EventMap[K]>,
      once: l.once,
    }))
  }

  /**
   * Returns an array of event names for which there are registered listeners.
   */
  eventNames(): Array<keyof EventMap> {
    return Array.from(this.eventListenersMap.keys())
  }

  /**
   * Sets the maximum number of listeners that can be registered for any single event.
   */
  setMaxListeners(n: number): this {
    this.maxListeners = n
    return this
  }

  /**
   * Returns the current maximum number of listeners.
   */
  getMaxListeners(): number {
    return this.maxListeners
  }

  /**
   * Adds the listener to the beginning of the listeners array.
   */
  prependListener<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    const eventListeners = this.eventListenersMap.get(event) || []
    eventListeners.unshift({ fn: listener, once: false })
    this.eventListenersMap.set(event, eventListeners)
    return this
  }

  /**
   * Adds a one-time listener to the beginning of the listeners array.
   */
  prependOnceListener<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    const eventListeners = this.eventListenersMap.get(event) || []
    eventListeners.unshift({ fn: listener, once: true })
    this.eventListenersMap.set(event, eventListeners)
    return this
  }

  /**
   * Checks if the event has any listeners.
   */
  hasListeners<K extends keyof EventMap>(event: K): boolean {
    return this.listenerCount(event) > 0
  }

  /**
   * Emits an event with the provided arguments.
   */
  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): boolean {
    const eventListeners = this.eventListenersMap.get(event)

    if (!eventListeners || eventListeners.length === 0) {
      // Special handling for unhandled 'error' events
      if (event === ("error" as K)) {
        const error = args[0]
        if (error instanceof Error) {
          throw error
        }
        throw new Error(`Unhandled error: ${String(error)}`)
      }
      return false
    }

    // Make a copy to avoid issues if listeners are removed during emission
    const listenersCopy = [...eventListeners]

    // Keep track of listeners to remove (once listeners that have been called)
    const listenersToRemove: Array<Listener<any>> = []

    for (const { fn, once } of listenersCopy) {
      try {
        // This type assertion is necessary due to TypeScript's limitations
        ;(fn as Listener<EventMap[K]>)(...args)

        if (once) {
          listenersToRemove.push(fn)
        }
      } catch (error) {
        // Remove once listeners even if they throw
        if (once) {
          listenersToRemove.push(fn)
        }

        // Handle error
        this.handleError(error)
      }
    }

    // Remove once listeners after all listeners have been called
    for (const fn of listenersToRemove) {
      this.off(event, fn as Listener<EventMap[K]>)
    }

    return true
  }

  /**
   * Handles errors by emitting them as 'error' events or throwing them.
   */
  private handleError(error: unknown): void {
    const errorEvent = "error" as keyof EventMap

    if (this.hasListeners(errorEvent)) {
      try {
        // This is a safe operation at runtime, but TypeScript can't verify it statically
        const errorObj = error instanceof Error ? error : new Error(String(error))
        const errorHandlers = this.eventListenersMap.get(errorEvent) || []

        // Process error handlers synchronously
        for (const { fn, once } of [...errorHandlers]) {
          try {
            // We need to use a type assertion here as TypeScript can't infer the
            // exact structure of error handlers
            ;(fn as Listener<[Error]>)(errorObj)
          } catch (innerError) {
            // Avoid infinite recursion if error handlers throw
            console.error("Error in error event handler:", innerError)
          }

          if (once) {
            // Remove once error listeners
            this.off(errorEvent, fn as Listener<EventMap[keyof EventMap]>)
          }
        }
      } catch (_: unknown) {
        // If something goes wrong in our error handling, throw the original error
        throw error
      }
    } else {
      // No error handlers, so just throw
      throw error
    }
  }
}
