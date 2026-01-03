
declare module 'native/io' {

  /**
   * Represents an HTTP request configuration
   */
  interface HttpRequest {
    /** The URL to make the request to */
    url: string;

    /** Optional headers to include in the request */
    headers?: { [key: string]: string };

    /** HTTP method (GET, POST, etc.) */
    method?: string;

    /** Data to send in the request body */
    postData?: string | Uint8Array | { [key: string]: string };


    /** Query parameters to include in the URL */
    args?: { [key: string]: string };

    /** Enable debug logging for the request */
    debug?: boolean;

    /** Disable automatic redirect following */
    noFollow?: boolean;

    /** Enable compression for the request */
    compression?: boolean;

    /** Disable authentication for the request */
    noAuth?: boolean;

    /** Return content even if the request fails */
    noFail?: boolean;

    /** Enable SSL certificate verification */
    verifySSL?: boolean;

    /** Timeout for the request in milliseconds */
    timeout?: number;

    /** Custom user agent string */
    userAgent?: string;


    /** Make a HEAD request instead of GET */
    headRequest?: boolean;

    /** Minimum cache time in seconds */
    cacheTime?: number;

    /** Enable caching for the request */
    caching?: boolean;
  }

  /**
   * Represents an HTTP response
   */
  interface HttpResponse {
    /** Response body as a Uint8Array */
    buffer?: Uint8Array;


    /** Response headers */
    responseHeaders: { [key: string]: string };

    /** HTTP status code */
    statusCode: number;
  }

  /**
   * Makes an HTTP request
   * @param request - Configuration for the HTTP request
   * @returns Promise that resolves with the HTTP response
   */
  function httpReq(request: HttpRequest): Promise<HttpResponse>;

  /**
   * Creates an HTTP inspector for intercepting requests
   * @param pattern - Regex pattern to match URLs
   * @param async - Whether to handle requests asynchronously
   */
  function httpInspectorCreate(pattern: string, async: boolean): void;

  /**
   * Probes a URL to check its availability
   * @param url - URL to probe
   * @param timeout - Timeout in milliseconds
   * @returns Promise that resolves with probe result
   */
  function probe(url: string, timeout: number): Promise<{ result: number; errmsg?: string }>;

  /**
   * Makes an XML-RPC request
   * @param url - XML-RPC server URL
   * @param method - Method to call
   * @param args - Arguments as a JSON string
   * @returns Promise that resolves with the response
   */
  function xmlrpc(url: string, method: string, args: string): Promise<any>;

  /**
   * Represents an HTTP inspector request object
   */
  interface HttpInspector {
    /** URL being inspected */
    url: string;

    /** Whether authentication has failed */
    authFailed: boolean;

    /** Fail the request with an error message */
    fail(reason: string): void;

    /** Proceed with the request */
    proceed(): void;

    /** Ignore this inspection and continue */
    ignore(): void;

    /** Set a request header */
    setHeader(key: string, value: string): void;

    /** Set or clear a cookie */
    setCookie(key: string, value?: string): void;
  }

  /**
   * Callback function for HTTP inspection
   */
  type HttpInspectorCallback = (request: HttpInspector) => boolean | void;

  /**
   * Creates an HTTP inspector
   * @param callback - Function to handle inspection
   * @param pattern - URL pattern to match (regex)
   * @param async - Whether to handle inspection asynchronously
   */
  function httpInspector(callback: HttpInspectorCallback, pattern: string, async?: boolean): void;
}
