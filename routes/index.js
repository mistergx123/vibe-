import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ====================== ROTA TRIAGEM - GEMINI ======================
router.post('/api/triagem', async (req, res) => {
    try {
        const model = req.app.locals.model;

        if (!model) {
            console.error("❌ Model do Gemini não encontrado no app.locals");
            return res.status(500).json({ error: "Gemini não configurado" });
        }

        const { idade, tempo, sintoma, febre, regiao } = req.body;

        console.log("📥 Dados recebidos:", { idade, tempo, febre, regiao, sintomaLength: sintoma?.length });

        if (!sintoma?.trim()) {
            return res.status(400).json({ error: 'Descreva os sintomas.' });
        }

        const prompt = `
Você é um médico especialista em triagem de urgência.
Analise os dados abaixo e retorne APENAS um JSON válido.

Paciente:
- Idade: ${idade || 'não informada'}
- Duração: ${tempo || 'não informado'}
- Febre: ${febre || 'não informado'}
- Região: ${regiao || 'não especificada'}
- Sintomas: ${sintoma}

Responda EXATAMENTE neste formato:
{
  "urgencia": "alta" | "media" | "baixa",
  "emoji": "🟥" | "🟨" | "🟩",
  "titulo": "Título curto",
  "descricao": "Descrição clara",
  "causa": "Provável causa",
  "prazo": "Quando procurar ajuda",
  "passos": ["passo 1", "passo 2", "passo 3"]
}
`;

        console.log("🤖 Enviando prompt para Gemini...");

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        console.log("📤 Resposta bruta do Gemini:", responseText.substring(0, 300) + "...");

        // Limpa markdown
        responseText = responseText.replace(/```json|```/g, '').trim();

        const data = JSON.parse(responseText);

        res.json(data);

    } catch (error) {
        console.error("❌ ERRO COMPLETO NA TRIAGEM:", error);
        console.error("Nome do erro:", error.name);
        console.error("Mensagem:", error.message);

        res.status(500).json({
            urgencia: "media",
            emoji: "⚠️",
            titulo: "Erro no processamento",
            descricao: "Não foi possível analisar os sintomas no momento.",
            causa: "Erro interno do sistema",
            prazo: "Tente novamente em alguns segundos",
            passos: ["Recarregue a página", "Tente descrever os sintomas novamente"]
        });
    }
});

// Rota para servir a página
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/Triagem.html'));
});

export default router;
