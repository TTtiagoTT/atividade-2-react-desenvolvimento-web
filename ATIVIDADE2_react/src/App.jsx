// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css'; // Certifique-se que o seu CSS principal está aqui
import HandposeDetector from './components/HandposeDetector/HandposeDetector';
import StartScreen from './components/Screens/StartScreen';
import DifficultyScreen from './components/Screens/DifficultyScreen';
import CountdownScreen from './components/Screens/CountdownScreen';
import QuizScreen from './components/Screens/QuizScreen/QuizScreen';
import ResultsScreen from './components/Screens/ResultsScreen';

// Função utilitária para verificar se o cursor está sobre um elemento
// Considere mover para um ficheiro utils/helpers.js se usar em muitos locais
export function isCursorOverElement(cursorPos, element, margin = 0) {
  if (!cursorPos || !element) return false;
  const rect = element.getBoundingClientRect();
  return (
    cursorPos.x >= rect.left - margin &&
    cursorPos.x <= rect.right + margin &&
    cursorPos.y >= rect.top - margin &&
    cursorPos.y <= rect.bottom + margin // CORRIGIDO: de marginx para margin
  );
}

const GAME_STATES = {
  START: 'START',
  DIFFICULTY: 'DIFFICULTY',
  COUNTDOWN: 'COUNTDOWN',
  QUIZ: 'QUIZ',
  RESULTS: 'RESULTS',
};

const DIFFICULTIES = [
    { id: 0, label: 'Fácil' },
    { id: 1, label: 'Médio' },
    { id: 2, label: 'Difícil' },
    { id: 3, label: 'Aleatório' }, // A sua API precisa de lidar com este ID
];

function App() {
  const [gameState, setGameState] = useState(GAME_STATES.START);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [handDetected, setHandDetected] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const timeDelayForAction = 1000; // Tempo em ms para "clique" por gesto

  const handleHandMove = useCallback((pos, detected, errorOccurred) => {
    if (errorOccurred) {
        console.error("App.jsx: Erro no HandposeDetector comunicado.");
        // Poderia definir um estado de erro aqui para mostrar na UI, se desejado
        return;
    }
    setCursorPosition(pos);
    setHandDetected(detected);
  }, []);

  const handleStartGame = useCallback(() => {
    console.log("App.jsx: Iniciando Jogo. Resetando estados.");
    setScore(0);
    setErrors(0);
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setSelectedDifficulty(null);
    setIsFeedbackVisible(false);
    setGameState(GAME_STATES.DIFFICULTY);
  }, []); // Adicione setters de estado como dependências se o linter avisar

  const handleDifficultySelect = useCallback(async (difficulty) => {
    if (!difficulty || typeof difficulty.id === 'undefined') {
        console.error("App.jsx: handleDifficultySelect chamada com dificuldade inválida:", difficulty);
        alert("Ocorreu um erro ao selecionar a dificuldade. Tente novamente.");
        setIsLoadingQuestions(false); // Garante que o loading é resetado
        setGameState(GAME_STATES.DIFFICULTY);
        return;
    }

    setSelectedDifficulty(difficulty);
    setIsLoadingQuestions(true);
    console.log(`App.jsx: Dificuldade selecionada - Label: ${difficulty.label}, ID: ${difficulty.id}. A carregar perguntas...`);

    try {
      const apiUrl = `http://localhost:8000/api/questions/${difficulty.id}`;
      console.log(`App.jsx: A fazer chamada API para: ${apiUrl}`);
      const response = await axios.get(apiUrl);
      const fetchedQuestions = response.data;
      
      console.log("App.jsx: Resposta da API recebida. Status:", response.status);
      console.log("App.jsx: Perguntas recebidas (response.data):", fetchedQuestions);

      if (fetchedQuestions && fetchedQuestions.length > 0) {
        console.log(`App.jsx: ${fetchedQuestions.length} perguntas recebidas. A definir estado do jogo para COUNTDOWN.`);
        setQuestions(fetchedQuestions);
        setGameState(GAME_STATES.COUNTDOWN);
      } else {
        console.warn(`App.jsx: Nenhuma pergunta encontrada para dificuldade ID ${difficulty.id} (${difficulty.label}).`);
        alert(`Nenhuma pergunta encontrada para a dificuldade: ${difficulty.label}. Verifique o ficheiro questions.json na sua API ou tente outra dificuldade.`);
        setQuestions([]);
        setGameState(GAME_STATES.DIFFICULTY); // Permanece na tela de dificuldade
      }
    } catch (error) {
      console.error("App.jsx: Erro ao buscar perguntas da API:", error);
      if (error.response) {
        console.error("App.jsx: Dados do erro da API:", error.response.data);
        console.error("App.jsx: Estado do erro da API:", error.response.status);
      } else if (error.request) {
        console.error("App.jsx: Nenhum pedido de resposta da API recebido (API offline ou CORS?):", error.request);
        alert("Falha ao comunicar com a API. O servidor está offline, inacessível ou há um problema de CORS?");
      } else {
        console.error('App.jsx: Erro na configuração do pedido da API:', error.message);
      }
      alert("Falha ao carregar perguntas. Verifique a consola para detalhes e se a API está a funcionar corretamente.");
      setGameState(GAME_STATES.DIFFICULTY);
    } finally {
      console.log("App.jsx: Finalizando handleDifficultySelect. isLoadingQuestions será false.");
      setIsLoadingQuestions(false);
    }
  }, []); // Adicione setters de estado aqui se o linter o exigir

  const handleCountdownEnd = useCallback(() => {
    console.log("App.jsx: Contagem regressiva terminada. A mudar para estado QUIZ.");
    setCurrentQuestionIndex(0);
    setTimeLeft(15);
    setGameState(GAME_STATES.QUIZ);
  }, []); // Adicione setters de estado aqui se o linter o exigir

  const handleAnswerSelected = useCallback((selectedIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        console.warn("App.jsx: handleAnswerSelected chamada sem currentQuestion.");
        return;
    }

    console.log(`App.jsx: Opção selecionada índice: ${selectedIndex}, Resposta correta índice: ${currentQuestion.correta}`);
    if (selectedIndex === currentQuestion.correta) {
      setScore(prevScore => prevScore + (currentQuestion.dificuldade + 1 || 1)); // +1 para dificuldade 0 dar 1 ponto
      setFeedback({ message: '✅ Correto!', type: 'correct' });
    } else {
      setErrors(prevErrors => prevErrors + 1);
      setFeedback({ message: `❌ Errado! Resposta: ${currentQuestion.opcoes[currentQuestion.correta]}`, type: 'incorrect' });
    }
    setIsFeedbackVisible(true);
  }, [questions, currentQuestionIndex]); // Adicione setters de estado aqui se o linter o exigir

  const handleNextQuestion = useCallback(() => {
    setIsFeedbackVisible(false);
    if (errors >= 3) {
        console.log("App.jsx: Limite de erros atingido. A ir para Resultados.");
        setGameState(GAME_STATES.RESULTS);
        return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      console.log("App.jsx: A ir para a próxima pergunta.");
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setTimeLeft(15);
    } else {
      console.log("App.jsx: Fim das perguntas. A ir para Resultados.");
      setGameState(GAME_STATES.RESULTS);
    }
  }, [currentQuestionIndex, questions.length, errors]); // Adicione setters de estado aqui se o linter o exigir

  const handleTimeUp = useCallback(() => {
    if (gameState !== GAME_STATES.QUIZ) return;
    console.log("App.jsx: Tempo esgotado para a pergunta.");
    setErrors(prevErrors => prevErrors + 1);
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerText = currentQuestion && currentQuestion.opcoes && typeof currentQuestion.correta !== 'undefined' && currentQuestion.opcoes[currentQuestion.correta]
        ? currentQuestion.opcoes[currentQuestion.correta]
        : "N/A";
    setFeedback({ message: `⏰ Tempo esgotado! Resposta: ${correctAnswerText}`, type: 'info' });
    setIsFeedbackVisible(true);
  }, [questions, currentQuestionIndex, gameState]); // Adicione setters de estado aqui se o linter o exigir

  const handleExitGame = useCallback(() => {
    console.log("App.jsx: handleExitGame chamado. A mudar para estado RESULTS.");
    setGameState(GAME_STATES.RESULTS);
  }, []); // Adicione setGameState se o linter o exigir

  const handleRestartGame = useCallback(() => {
    console.log("App.jsx: handleRestartGame chamado.");
    handleStartGame(); // Reutiliza a lógica de reset
  }, [handleStartGame]);

  const renderCurrentScreen = () => {
    if (isLoadingQuestions) {
        return <div style={{ fontSize: '2em', color: 'white', textAlign: 'center', paddingTop: '20%' }}>Carregando perguntas...</div>;
    }

    switch (gameState) {
      case GAME_STATES.START:
        return <StartScreen onStartGame={handleStartGame} cursorPosition={cursorPosition} timeDelay={timeDelayForAction} />;
      case GAME_STATES.DIFFICULTY:
        return <DifficultyScreen difficulties={DIFFICULTIES} onDifficultySelect={handleDifficultySelect} cursorPosition={cursorPosition} timeDelay={timeDelayForAction} />;
      case GAME_STATES.COUNTDOWN:
        return <CountdownScreen onCountdownEnd={handleCountdownEnd} />;
      case GAME_STATES.QUIZ:
        if (questions.length === 0 || currentQuestionIndex >= questions.length) {
            console.warn("App.jsx: Tentativa de renderizar QuizScreen sem perguntas válidas ou índice fora dos limites. Voltando para DIFICULDADE.");
            // Evita loop infinito se setGameState estiver nas dependências de handleDifficultySelect
            // e for chamado aqui diretamente. Uma melhoria seria ter um estado de erro.
            // Por agora, apenas renderiza mensagem e espera nova seleção de dificuldade.
            if (gameState !== GAME_STATES.DIFFICULTY) { // Prevenir loop se já estiver em DIFFICULTY e não houver perguntas
                 setTimeout(() => setGameState(GAME_STATES.DIFFICULTY), 0); // Adia a mudança de estado
            }
            return <p style={{color: "white", textAlign: "center", fontSize: "1.5em", paddingTop: "20%"}}>Nenhuma pergunta carregada ou erro. Por favor, selecione uma dificuldade.</p>;
        }
        return (
            <QuizScreen
                question={questions[currentQuestionIndex]}
                onAnswerSelect={handleAnswerSelected}
                onNextQuestion={handleNextQuestion}
                onExitGame={handleExitGame}
                score={score}
                errors={errors}
                timeLeft={timeLeft}
                setTimeLeft={setTimeLeft}
                handDetected={handDetected}
                cursorPosition={cursorPosition}
                timeDelay={timeDelayForAction}
                feedback={feedback}
                isFeedbackVisible={isFeedbackVisible}
                setIsFeedbackVisible={setIsFeedbackVisible}
                onTimeUp={handleTimeUp}
                currentQuestionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
            />
        );
      case GAME_STATES.RESULTS:
        return <ResultsScreen score={score} onRestartGame={handleRestartGame} cursorPosition={cursorPosition} timeDelay={timeDelayForAction} />;
      default:
        return <StartScreen onStartGame={handleStartGame} cursorPosition={cursorPosition} timeDelay={timeDelayForAction} />;
    }
  };

  return (
    <div className="App">
      <HandposeDetector onHandMove={handleHandMove} />
      <h1 id="titulo-projeto" className={gameState === GAME_STATES.QUIZ || gameState === GAME_STATES.RESULTS ? 'quiz-active' : ''}>
        TapQuiz
      </h1>

      {renderCurrentScreen()}

      {/* Cursor verde visual */}
      {cursorPosition && (
        <div
          style={{
            position: 'fixed',
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            width: '24px',
            height: '24px',
            background: 'rgba(0, 255, 0, 0.7)',
            border: '1px solid white',
            borderRadius: '50%',
            pointerEvents: 'none', // Para não interferir com outros elementos
            transform: 'translate(-50%, -50%)', // Centraliza o cursor no ponto
            zIndex: 9999, // Para ficar no topo de tudo
            transition: 'transform 0.05s ease-out' // Suaviza o movimento
          }}
        />
      )}
       {/* O botão Sair foi movido para dentro do QuizScreen.jsx */}
    </div>
  );
}

export default App;
