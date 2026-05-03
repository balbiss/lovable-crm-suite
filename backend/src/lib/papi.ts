import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const papiClient = axios.create({
  baseURL: process.env.PAPI_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.PAPI_API_KEY
  }
});

export default papiClient;
