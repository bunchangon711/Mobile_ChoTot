import axios from "axios";

//export const baseURL = "http://10.24.12.71:8000";

export const baseURL = "http://10.0.2.2:8000";

const client = axios.create({ baseURL });

export default client;
