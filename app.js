import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import indexRouter from './routes/index.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CORS ====================
app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
);

// ==================== Path Configuration ====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ==================== Gemini Client (CORRIGIDO) ====================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",           // Modelo estável e recomendado em 2026
  systemInstruction: "Você é um médico especialista em triagem de urgência. Seja objetivo, claro e responsável."
});

// Tornar disponível para todas as rotas
app.locals.genAI = genAI;
app.locals.model = model;

// ==================== Routes ====================
app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✨ Gemini API configurada com modelo: gemini-2.5-flash`);
});
