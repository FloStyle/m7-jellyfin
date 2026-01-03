declare module 'native/websocket' {
  /**
   * WebSocket client interface
   */
  interface WebSocketClient {
    /**
     * Create WebSocket client
     * @param url WebSocket URL
     * @param protocol Optional subprotocol
     * @param callbacks Callback functions
     * @returns WebSocket client object
     */
    create(
      url: string,
      protocol?: string,
      callbacks?: {
        onConnect?: () => void;
        onInput?: (data: string | ArrayBuffer) => void;
        onClose?: (code: number, reason: string) => void;
      }
    ): WebSocketClientInstance;

    /**
     * Send data through WebSocket
     * @param data Data to send (string or ArrayBuffer)
     */
    send(data: string | ArrayBuffer): void;
  }

  /**
   * WebSocket client instance interface
   */
  interface WebSocketClientInstance {
    /**
     * Send data through WebSocket
     * @param data Data to send (string or ArrayBuffer)
     */
    send(data: string | ArrayBuffer): void;
  }

  /**
   * WebSocket server interface
   */
  interface WebSocketServer {
    /**
     * Create WebSocket server
     * @param path Server path
     * @param callbacks Callback functions
     * @returns WebSocket server object
     */
    create(
      path: string,
      callbacks?: {
        onOpen?: (connection: WebSocketConnection) => void;
        onInput?: (connection: WebSocketConnection, data: string | ArrayBuffer) => void;
        onClose?: (connection: WebSocketConnection) => void;
      }
    ): WebSocketServerInstance;
  }

  /**
   * WebSocket server instance interface
   */
  interface WebSocketServerInstance {
    /**
     * Send data to a connection
     * @param connection Connection to send to
     * @param data Data to send (string or ArrayBuffer)
     */
    send(connection: WebSocketConnection, data: string | ArrayBuffer): void;

    /**
     * Close a connection
     * @param connection Connection to close
     * @param code Close code
     * @param reason Close reason
     */
    close(connection: WebSocketConnection, code?: number, reason?: string): void;
  }

  /**
   * WebSocket connection interface
   */
  interface WebSocketConnection {
    /**
     * Send data through WebSocket
     * @param data Data to send (string or ArrayBuffer)
     */
    send(data: string | ArrayBuffer): void;

    /**
     * Close WebSocket connection
     * @param code Close code
     * @param reason Close reason
     */
    close(code?: number, reason?: string): void;
  }

  const websocket: {
    /**
     * WebSocket client operations
     */
    client: WebSocketClient;

    /**
     * WebSocket server operations
     */
    server: WebSocketServer;
  };

  export = websocket;
}
