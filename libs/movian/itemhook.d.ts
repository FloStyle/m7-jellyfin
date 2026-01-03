declare module 'movian/itemhook' {
  /**
   * Item hook configuration
   */
  interface ItemHookConfig {
    /**
     * Item type
     */
    itemtype: string;

    /**
     * Item title
     */
    title: string;

    /**
     * Item icon
     */
    icon: string;

    /**
     * Item handler function
     * @param item Item property
     * @param nav Navigation object
     */
    handler: (item: object, nav: { openURL: (url: string) => void }) => void;
  }

  /**
   * Item hook interface
   */
  interface ItemHook {
    /**
     * Create item hook
     * @param config Item hook configuration
     * @returns Item hook instance
     */
    create(config: ItemHookConfig): ItemHookInstance;
  }

  /**
   * Item hook instance interface
   */
  interface ItemHookInstance {
    /**
     * Destroy item hook
     */
    destroy(): void;
  }

  const itemhook: ItemHook;
  export = itemhook;
}
