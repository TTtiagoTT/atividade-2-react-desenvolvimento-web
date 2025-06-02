# main.py
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Union # Union pode não ser necessário se disciplina for sempre string ou sempre None
from fastapi.middleware.cors import CORSMiddleware

class Question(BaseModel):
    id: int
    pergunta: str
    opcoes: List[str]  # Alternativa1, alternativa2, etc. Viram uma lista
    correta: int       # O índice da opção correta na lista 'opcoes' (começando do 0)
    dificuldade: int   # 0 para Fácil, 1 para Médio, 2 para Difícil
    disciplina: Union[str, None] = None 

# Inicialize o aplicativo FastAPI
app = FastAPI()

# Configuração do CORS
origins = [
    "http://localhost",       # Se você acessar o React sem porta específica (raro em dev)
    "http://localhost:3000",  # Porta comum para create-react-app
    "http://localhost:5173",  # Porta comum para Vite (que você está usando)
    # Adicione a URL do seu frontend se for diferente
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Lista de origens que podem fazer requisições
    allow_credentials=True,      # Permite cookies (se você usar)
    allow_methods=["*"],         # Permite todos os métodos HTTP (GET, POST, etc.)
    allow_headers=["*"],         # Permite todos os cabeçalhos
)

def load_questions_from_file(filepath: str = "questions.json") -> Dict[int, List[Dict]]:
    print(f"DEBUG: Tentando carregar '{filepath}'...") # Novo print
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"DEBUG: Conteúdo bruto do JSON carregado: {data}") # Novo print
            converted_data = {int(k): v for k, v in data.items()}
            print(f"DEBUG: Dados convertidos (chaves int): {converted_data}") # Novo print
            return converted_data
    except FileNotFoundError:
        print(f"AVISO IMPORTANTE: Arquivo '{filepath}' não encontrado. Nenhuma pergunta carregada.")
        return {}
    except json.JSONDecodeError as e: # Adicionado 'as e' para imprimir o erro
        print(f"AVISO IMPORTANTE: Erro ao decodificar JSON de '{filepath}'. Erro: {e}. Nenhuma pergunta carregada.")
        return {}
    except Exception as e: # Pega qualquer outra exceção durante o carregamento
        print(f"ERRO INESPERADO ao carregar '{filepath}': {e}")
        return {}
    
# Carrega as perguntas quando a API inicia
questions_data = load_questions_from_file() # Esta linha lê do questions.json
print(f"DEBUG FINAL: Conteúdo de questions_data após carregamento: {questions_data}") # Novo print

# Endpoint para buscar perguntas por ID de dificuldade
@app.get("/api/questions/{difficulty_id}", response_model=List[Question])
async def get_questions_by_difficulty(difficulty_id: int):
    # ... (seu endpoint de perguntas) ...
    print(f"API: /api/questions/{difficulty_id} acessado.") # Novo print
    if difficulty_id in questions_data:
        return questions_data[difficulty_id]
    else:
        return []

@app.get("/")
async def read_root():
    print("API: Endpoint raiz ('/') acessado.")
    if questions_data: # Verifica se questions_data não está vazio
        print("API: questions_data contém dados.")
        return {"message": "Bem-vindo à API do TapQuiz! Perguntas carregadas do JSON."}
    else:
        print("API: questions_data está VAZIO.")
        return {"message": "Bem-vindo à API do TapQuiz! (Arquivo de perguntas não encontrado ou JSON vazio/inválido)"}


# Para rodar: uvicorn main:app --reload