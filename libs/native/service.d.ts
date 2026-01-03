declare module 'native/service' {
  /**
   * Service interface
   */
  interface Service {
    /**
     * Create new service
     * @param id Service ID
     * @param title Service title
     * @param url Service URL
     * @param type Service type
     * @param enabled Whether service is enabled
     * @param icon Optional icon URL
     * @returns Service object
     */
    create(
      id: string,
      title: string,
      url: string,
      type: string,
      enabled: boolean,
      icon?: string
    ): object;

    /**
     * Enable or disable service
     * @param service Service object
     * @param enabled Whether to enable the service
     */
    enable(service: object, enabled: boolean): void;

    /**
     * Check if service is enabled
     * @param service Service object
     * @returns Whether service is enabled
     */
    isEnabled(service: object): boolean;
  }

  const service: Service;
  export = service;
}
