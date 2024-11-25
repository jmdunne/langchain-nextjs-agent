export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

export const proxyList: ProxyConfig[] = [
  // Add your proxy configurations here
  // Example:
  // {
  //   host: "proxy1.example.com",
  //   port: 8080,
  // }
]; 