# main.py
import json
import random # Importar o módulo random
import httpx # Usaremos httpx para chamadas async à API do Gemini
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Union, Any 
from fastapi.middleware.cors import CORSMiddleware

# --- Modelos Pydantic ---
class Question(BaseModel):
    id: int
    pergunta: str
    opcoes: List[str]
    correta: int
    dificuldade: int
    disciplina: Union[str, None] = None

class PlayedQuestion(BaseModel):
    pergunta: str
    disciplina: Union[str, None] = None
    # id: int # Opcional, se quiser usar o ID para algo no backend

class FeedbackRequest(BaseModel):
    played_questions: List[PlayedQuestion]

# --- Inicialização do Aplicativo FastAPI ---
app = FastAPI()

# --- Configuração do CORS ---
origins = [
    "http://localhost",
    "http://localhost:3000",  # Porta comum para create-react-app
    "http://localhost:5173",  # Porta comum para Vite (que você está usando)
    # Adicione a URL do seu frontend se for diferente
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Carregamento de Perguntas ---
def load_questions_from_file(filepath: str = "questions.json") -> Dict[int, List[Question]]:
    """
    Carrega as perguntas de um arquivo JSON.
    Espera-se que o JSON seja um dicionário onde as chaves são IDs de dificuldade (como strings)
    e os valores são listas de objetos de perguntas.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Converte as chaves de dificuldade para inteiros e valida a estrutura das perguntas
            converted_data: Dict[int, List[Question]] = {}
            for k, v_list in data.items():
                try:
                    difficulty_id = int(k)
                    # Valida cada pergunta usando o modelo Pydantic Question
                    converted_data[difficulty_id] = [Question(**item) for item in v_list]
                except ValueError:
                    print(f"Aviso: Chave de dificuldade '{k}' no JSON não é um inteiro válido e será ignorada.")
                except Exception as e_item: # Pega erros de validação do Pydantic ou outros
                    print(f"Aviso: Erro ao processar item para dificuldade '{k}': {e_item}. Item problemático: {v_list}")
            return converted_data
    except FileNotFoundError:
        print(f"AVISO IMPORTANTE: Arquivo '{filepath}' não encontrado. Nenhuma pergunta carregada.")
        return {}
    except json.JSONDecodeError as e:
        print(f"AVISO IMPORTANTE: Erro ao decodificar JSON de '{filepath}'. Erro: {e}. Nenhuma pergunta carregada.")
        return {}
    except Exception as e: # Pega qualquer outra exceção durante o carregamento
        print(f"ERRO INESPERADO ao carregar '{filepath}': {e}")
        return {}
    
questions_data: Dict[int, List[Question]] = load_questions_from_file()

# --- Constantes para Dificuldades ---
SPECIFIC_DIFFICULTY_IDS = [0, 1, 2] # Assumindo que Fácil=0, Médio=1, Difícil=2
RANDOM_DIFFICULTY_ID = 3 # Assumindo que Aleatório=3
NUMBER_OF_RANDOM_QUESTIONS = 10 # Quantas perguntas retornar para "Aleatório"

# --- Endpoints da API ---
@app.get("/")
async def read_root():
    """Endpoint raiz para verificar se a API está funcionando."""
    print("API: Endpoint raiz ('/') acessado.")
    if questions_data:
        print("API: questions_data contém dados.")
        return {"message": "Bem-vindo à API do TapQuiz! Perguntas carregadas."}
    else:
        print("API: questions_data está VAZIO ou ocorreu um erro ao carregar.")
        return {"message": "Bem-vindo à API do TapQuiz! (Arquivo de perguntas não encontrado ou JSON vazio/inválido)"}

@app.get("/api/questions/{difficulty_id}", response_model=List[Question])
async def get_questions_by_difficulty(difficulty_id: int):
    """Retorna uma lista de perguntas para a dificuldade especificada, baralhadas."""
    print(f"API: /api/questions/{difficulty_id} acessado.")
    
    questions_to_return: List[Question] = []

    if difficulty_id == RANDOM_DIFFICULTY_ID:
        print(f"API: Solicitada dificuldade Aleatória (ID: {RANDOM_DIFFICULTY_ID}).")
        all_questions_for_random: List[Question] = []
        for spec_id in SPECIFIC_DIFFICULTY_IDS:
            # Usa .get() para segurança, caso uma chave de dificuldade não exista
            all_questions_for_random.extend(questions_data.get(spec_id, []))
        
        if all_questions_for_random:
            random.shuffle(all_questions_for_random)
            questions_to_return = all_questions_for_random[:NUMBER_OF_RANDOM_QUESTIONS]
            print(f"API: Retornando {len(questions_to_return)} perguntas aleatórias.")
        else:
            print("API: Nenhuma pergunta disponível nas dificuldades específicas para compor 'Aleatório'.")
            # Retorna lista vazia explicitamente se não houver o que compor
            return [] 

    elif difficulty_id in questions_data:
        # Pega uma cópia da lista de perguntas para não modificar questions_data globalmente
        specific_questions = list(questions_data[difficulty_id]) 
        random.shuffle(specific_questions)
        questions_to_return = specific_questions
        print(f"API: Retornando {len(questions_to_return)} perguntas baralhadas para dificuldade ID {difficulty_id}.")
    else:
        print(f"API: Nenhuma pergunta encontrada para dificuldade ID {difficulty_id}.")
        # Retorna lista vazia explicitamente se o ID não existir
        return [] 

    return questions_to_return

@app.post("/api/generate-feedback")
async def generate_ai_feedback(request_data: FeedbackRequest):
    """Gera feedback personalizado usando a API do Gemini com base nas perguntas jogadas."""
    print(f"API: /api/generate-feedback acessado com {len(request_data.played_questions)} perguntas.")

    if not request_data.played_questions:
        raise HTTPException(status_code=400, detail="Nenhuma pergunta jogada foi fornecida.")

    prompt_parts = [
        "Com base nas seguintes perguntas de um quiz educacional que o utilizador acabou de jogar, gere um feedback positivo, curto e encorajador (no máximo 3-4 frases) sobre o que ele pode ter aprendido ou revisado. Mencione algumas das áreas de conhecimento ou habilidades abordadas de forma geral e amigável. Exemplo: 'Parabéns! Você explorou temas como [tema A] e curiosidades sobre [tema B]. Continue assim!'"
    ]
    prompt_parts.append("\nPerguntas Jogadas:")
    for i, q in enumerate(request_data.played_questions):
        disciplina_texto = f", Disciplina: {q.disciplina}" if q.disciplina else ""
        prompt_parts.append(f"{i+1}. Pergunta: \"{q.pergunta}\"{disciplina_texto}")
    
    final_prompt = "\n".join(prompt_parts)
    final_prompt += "\n\nFeedback Gerado:"
    print(f"API: Prompt final para Gemini:\n{final_prompt}")

    # IMPORTANTE SOBRE A API KEY:
    # NAO FACA COMMIT DA SUA API KEY PARA REPOSITORIOS PUBLICOS.
    api_key = "" #AQUI VC DEVE COLOCAR SUA API KEY QUE VC CRIOU E SE FOR COMPARTILHAR O CODIGO VC DEVE RETIRAR A SUA API KEY
    gemini_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
    
    payload = {
        "contents": [{"parts": [{"text": final_prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 1,
            "topP": 1,
            "maxOutputTokens": 200, # Limita o tamanho da resposta
            "stopSequences": [], # Pode adicionar sequências de paragem se necessário
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(gemini_api_url, json=payload)
            response.raise_for_status() 
            
            result = response.json()
            print(f"API: Resposta completa do Gemini: {json.dumps(result, indent=2)}")

            # Extração mais robusta do texto gerado
            candidates = result.get("candidates")
            if candidates and isinstance(candidates, list) and len(candidates) > 0:
                content = candidates[0].get("content")
                if content and isinstance(content, dict) and "parts" in content:
                    parts = content.get("parts")
                    if parts and isinstance(parts, list) and len(parts) > 0:
                        generated_text = parts[0].get("text", "")
                        if generated_text:
                            print(f"API: Texto gerado pelo Gemini: {generated_text}")
                            return {"feedback_text": generated_text.strip()}

            # Se não encontrou texto, verifica se houve bloqueio
            prompt_feedback = result.get("promptFeedback")
            if prompt_feedback and prompt_feedback.get("blockReason"):
                block_reason_message = prompt_feedback.get("blockReasonMessage", "Conteúdo bloqueado pela IA.")
                detail_message = f"Feedback não pôde ser gerado: {block_reason_message}"
                print(f"API: {detail_message}")
                raise HTTPException(status_code=500, detail=detail_message)
            
            print("API: Estrutura de resposta inesperada do Gemini ou sem texto gerado.")
            raise HTTPException(status_code=500, detail="Não foi possível extrair o feedback da resposta da IA.")

    except httpx.HTTPStatusError as e:
        print(f"API: Erro HTTP ao chamar Gemini: {e.response.status_code} - {e.response.text}")
        error_detail_msg = f"Erro ao comunicar com a IA ({e.response.status_code})."
        try:
            error_data = e.response.json()
            if error_data.get("error") and error_data["error"].get("message"):
                error_detail_msg += f" Detalhe: {error_data['error']['message']}"
        except Exception:
            pass 
        raise HTTPException(status_code=e.response.status_code, detail=error_detail_msg)
    except httpx.RequestError as e:
        print(f"API: Erro de requisição ao chamar Gemini: {e}")
        raise HTTPException(status_code=503, detail=f"Erro de rede ao tentar gerar feedback: {e}")
    except Exception as e:
        print(f"API: Erro inesperado ao gerar feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao tentar gerar feedback: {str(e)}")

# Para rodar:
# 1. Certifique-se de que tem um ficheiro 'questions.json' na mesma pasta.
# 2. Obtenha uma API Key para o Google Gemini:
# Vá ao Google AI Studio.
# Faça login com a sua conta Google.
# Crie uma nova API Key. Guarde esta chave em segurança.
# 3. Na funcao generate_ai_feedback, substitua a variável api_key pela sua chave.
# api_key = "SUA_API" (coloque dentro das aspas)
# !!!! NÃO FAÇA COMMIT DA SUA API KEY PARA O GIT SE O SEU REPOSITÓRIO FOR PUBLICO!
# 4. Crie e ative um ambiente virtual:
# python3 -m venv venv
# source venv/bin/activate
# 5. Instale as dependências:
# pip install "uvicorn[standard]" fastapi pydantic httpx
# 6. Execute o servidor:
# uvicorn main:app --reload
