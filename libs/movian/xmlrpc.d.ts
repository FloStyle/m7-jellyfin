declare module 'movian/xmlrpc' {
  /**
   * Make XML-RPC call
   * @param url XML-RPC endpoint URL
   * @param method Method name to call
   * @param params Method parameters
   */
  function call(url: string, method: string, ...params: any[]): any;

  export = call;
}
