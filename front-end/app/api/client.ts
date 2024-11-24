import axios from "axios";

//export const baseURL = "http://10.24.12.71:8000";

export const baseURL = __DEV__ 
  ? "http://10.0.2.2:8000"  // Make sure this matches your server
  : "https://your-production-url.com";

console.log('Using baseURL:', baseURL); // Add debug log

const client = axios.create({ 
  baseURL,
  timeout: 10000
});

export default client;
