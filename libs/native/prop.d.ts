declare module 'native/prop' {
  /**
   * Property value types
   */
  type PropValue = string | number | boolean | null;

  /**
   * Property event types
   */
  type PropEventType =
    | 'set'
    | 'dir'
    | 'uri'
    | 'wantmorechilds'
    | 'destroyed'
    | 'reqmove'
    | 'addchild'
    | 'addchildbefore'
    | 'addchilds'
    | 'addchildsbefore'
    | 'delchild'
    | 'movechild'
    | 'action'
    | 'unicode'
    | 'propref'
    | 'selectchild';

  /**
   * Property event callback
   */
  type PropEventCallback = (
    event: PropEventType,
    ...args: (PropValue | Prop)[]
  ) => void;

  /**
   * Property interface
   */
  interface Prop {
    /**
     * Print property tree
     */
    print(): void;

    /**
     * Release property
     */
    release(): void;

    /**
     * Create new property
     * @param name Property name
     * @returns New property
     */
    create(name: string): Prop;

    /**
     * Get property value
     * @returns Property value
     */
    getValue(): PropValue;

    /**
     * Get property name
     * @returns Property name
     */
    getName(): string;

    /**
     * Get child property
     * @param nameOrIndex Child name or index
     * @returns Child property or null
     */
    getChild(nameOrIndex: string | number): Prop | null;

    /**
     * Set property value
     * @param name Property name
     * @param value Property value
     */
    set(name: string, value: PropValue): void;

    /**
     * Set rich string value
     * @param name Property name
     * @param richStr Rich string value
     */
    setRichStr(name: string, richStr: string): void;

    /**
     * Set parent property
     * @param parent Parent property
     */
    setParent(parent: Prop): void;

    /**
     * Subscribe to property changes
     * @param options Subscription options
     * @returns Subscription object
     */
    subscribe(options: {
      autoDestroy?: boolean;
      ignoreVoid?: boolean;
      debug?: boolean;
      noInitialUpdate?: boolean;
      earlyChildDelete?: boolean;
      actionAsArray?: boolean;
    }): { destroy(): void };

    /**
     * Indicate if more children are available
     * @param yes Whether more children are available
     */
    haveMore(yes: boolean): void;

    /**
     * Create URL from property
     * @returns URL string
     */
    makeUrl(): string;

    /**
     * Get global property
     * @returns Global property
     */
    global(): Prop;

    /**
     * Enumerate child properties
     * @returns Array of child names/indices
     */
    enumerate(): (string | number)[];

    /**
     * Check if property has child
     * @param name Child name
     * @returns Whether child exists
     */
    has(name: string): boolean;

    /**
     * Delete child property
     * @param name Child name
     */
    deleteChild(name: string): void;

    /**
     * Delete all child properties
     */
    deleteChilds(): void;

    /**
     * Destroy property
     */
    destroy(): void;

    /**
     * Select property
     */
    select(): void;

    /**
     * Link property to another
     * @param target Target property
     */
    link(target: Prop): void;

    /**
     * Unlink property
     */
    unlink(): void;

    /**
     * Send event
     * @param type Event type
     * @param args Event arguments
     */
    sendEvent(type: string, args: Record<string, unknown>): void;

    /**
     * Check if property is a value
     * @returns Whether property is a value
     */
    isValue(): boolean;

    /**
     * Atomically add to property value
     * @param amount Amount to add
     */
    atomicAdd(amount: number): void;

    /**
     * Check if properties are the same
     * @param other Other property
     * @returns Whether properties are the same
     */
    isSame(other: Prop): boolean;

    /**
     * Move property before another
     * @param before Property to move before
     */
    moveBefore(before: Prop | null): void;

    /**
     * Mark property for destruction on unload
     */
    unloadDestroy(): void;

    /**
     * Check if property is a zombie
     * @returns Whether property is a zombie
     */
    isZombie(): boolean;

    /**
     * Set clipping range
     * @param min Minimum value
     * @param max Maximum value
     */
    setClipRange(min: number, max: number): void;

    /**
     * Node filter interface
     */
    nodeFilter: {
      /**
       * Create node filter
       * @param source Source property
       * @param target Target property
       * @returns Node filter
       */
      create(source: Prop, target: Prop): NodeFilter;

      /**
       * Add predicate to filter
       * @param path Property path
       * @param compare Comparison function
       * @param value Comparison value
       * @param enable Enable property
       * @param mode Filter mode
       * @returns Predicate ID
       */
      addPred(
        path: string,
        compare: 'eq' | 'neq',
        value: string | number,
        enable: Prop | null,
        mode: 'include' | 'exclude'
      ): number;

      /**
       * Remove predicate from filter
       * @param id Predicate ID
       */
      delPred(id: number): void;
    };
  }

  const prop: Prop;
  export = prop;
}
