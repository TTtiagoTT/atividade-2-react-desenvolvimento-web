// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';
import HandposeDetector from './components/HandposeDetector/HandposeDetector';
import StartScreen from './components/Screens/StartScreen';
import DifficultyScreen from './components/Screens/DifficultyScreen';
import CountdownScreen from './components/Screens/CountdownScreen';
import QuizScreen from './components/Screens/QuizScreen/QuizScreen';
import ResultsScreen from './components/Screens/ResultsScreen';

export function isCursorOverElement(cursorPos, element, margin = 0) {
  if (!cursorPos || !element) return false;
  const rect = element.getBoundingClientRect();
  return (
    cursorPos.x >= rect.left - margin &&
    cursorPos.x <= rect.right + margin &&
    cursorPos.y >= rect.top - margin &&
    cursorPos.y <= rect.bottom + margin
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
    { id: 3, label: 'Aleatório' },
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

  const timeDelayForAction = 1000;

  const handleHandMove = useCallback((pos, detected, errorOccurred) => {
    if (errorOccurred) {
        console.error("App.jsx: Erro no HandposeDetector comunicado.");
        return;
    }
    setCursorPosition(pos);
    setHandDetected(detected);
  }, []);

  const handleStartGame = useCallback(() => {
    setScore(0);
    setErrors(0);
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setSelectedDifficulty(null);
    setIsFeedbackVisible(false);
    setGameState(GAME_STATES.DIFFICULTY);
  }, []);

  const handleDifficultySelect = useCallback(async (difficulty) => {
    if (!difficulty || typeof difficulty.id === 'undefined') {
        console.error("App.jsx: handleDifficultySelect chamada com dificuldade inválida:", difficulty);
        alert("Ocorreu um erro ao selecionar a dificuldade. Tente novamente.");
        setIsLoadingQuestions(false);
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
      
      console.log("App.jsx: Resposta da API recebida:", response);
      console.log("App.jsx: Perguntas recebidas (response.data):", fetchedQuestions);

      if (fetchedQuestions && fetchedQuestions.length > 0) {
        console.log(`App.jsx: ${fetchedQuestions.length} perguntas recebidas. A definir estado do jogo para COUNTDOWN.`);
        setQuestions(fetchedQuestions);
        setGameState(GAME_STATES.COUNTDOWN);
      } else {
        console.warn(`App.jsx: Nenhuma pergunta encontrada para dificuldade ID ${difficulty.id} (${difficulty.label}).`);
        alert(`Nenhuma pergunta encontrada para a dificuldade: ${difficulty.label}. Verifique o ficheiro questions.json ou tente outra dificuldade.`);
        setQuestions([]);
        setGameState(GAME_STATES.DIFFICULTY);
      }
    } catch (error) {
      console.error("App.jsx: Erro ao buscar perguntas da API:", error);
      if (error.response) {
        // O pedido foi feito e o servidor respondeu com um código de estado
        // que cai fora do intervalo de 2xx
        console.error("App.jsx: Dados do erro da API:", error.response.data);
        console.error("App.jsx: Estado do erro da API:", error.response.status);
        console.error("App.jsx: Cabeçalhos do erro da API:", error.response.headers);
      } else if (error.request) {
        // O pedido foi feito mas nenhuma resposta foi recebida
        console.error("App.jsx: Nenhum pedido de resposta da API recebido:", error.request);
        alert("Falha ao comunicar com a API. O servidor está offline ou inacessível?");
      } else {
        // Algo aconteceu na configuração do pedido que acionou um Erro
        console.error('App.jsx: Erro na configuração do pedido da API:', error.message);
      }
      alert("Falha ao carregar perguntas. Verifique a consola para detalhes e se a API está a funcionar corretamente.");
      setGameState(GAME_STATES.DIFFICULTY);
    } finally {
      console.log("App.jsx: Finalizando handleDifficultySelect. isLoadingQuestions será false.");
      setIsLoadingQuestions(false);
    }
  }, []); // Adicionar setters de estado aqui se o linter o exigir (ex: [setGameState, setIsLoadingQuestions, setQuestions, setSelectedDifficulty])

  const handleCountdownEnd = useCallback(() => {
    console.log("App.jsx: Contagem regressiva terminada. A mudar para estado QUIZ.");
    setCurrentQuestionIndex(0);
    setTimeLeft(15);
    setGameState(GAME_STATES.QUIZ);
  }, []); // Adicionar setGameState, setCurrentQuestionIndex, setTimeLeft se necessário

  // ... (resto das funções handle... e renderCurrentScreen e return JSX permanecem os mesmos)
  // Certifique-se de que o resto do App.jsx (que não mostrei aqui para brevidade) está correto
  // e corresponde à versão anterior no Canvas.

  const handleAnswerSelected = useCallback((selectedIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    if (selectedIndex === currentQuestion.correta) {
      setScore(prevScore => prevScore + (currentQuestion.dificuldade + 1 || 1));
      setFeedback({ message: '✅ Correto!', type: 'correct' });
    } else {
      setErrors(prevErrors => prevErrors + 1);
      setFeedback({ message: `❌ Errado! Resposta: ${currentQuestion.opcoes[currentQuestion.correta]}`, type: 'incorrect' });
    }
    setIsFeedbackVisible(true);
  }, [questions, currentQuestionIndex]);

  const handleNextQuestion = useCallback(() => {
    setIsFeedbackVisible(false);
    if (errors >= 3) {
        setGameState(GAME_STATES.RESULTS);
        return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setTimeLeft(15);
    } else {
      setGameState(GAME_STATES.RESULTS);
    }
  }, [currentQuestionIndex, questions.length, errors]);

  const handleTimeUp = useCallback(() => {
    if (gameState !== GAME_STATES.QUIZ) return;
    setErrors(prevErrors => prevErrors + 1);
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerText = currentQuestion && currentQuestion.opcoes && currentQuestion.opcoes[currentQuestion.correta]
        ? currentQuestion.opcoes[currentQuestion.correta]
        : "N/A";
    setFeedback({ message: `⏰ Tempo esgotado! Resposta: ${correctAnswerText}`, type: 'info' });
    setIsFeedbackVisible(true);
  }, [questions, currentQuestionIndex, gameState]);

  const handleExitGame = useCallback(() => {
    setGameState(GAME_STATES.RESULTS);
  }, []);

  const handleRestartGame = useCallback(() => {
    handleStartGame();
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
            console.warn("App.jsx: Tentativa de renderizar QuizScreen sem perguntas válidas. Voltando para DIFICULDADE.");
            setGameState(GAME_STATES.DIFFICULTY); 
            return <p style={{color: "white", textAlign: "center", fontSize: "1.5em"}}>Nenhuma pergunta carregada. Por favor, selecione uma dificuldade.</p>;
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
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            transition: 'transform 0.1s ease-out'
          }}
        />
      )}
       {(gameState === GAME_STATES.QUIZ ) && (
        <button
          id="btn-exit"
          onClick={handleExitGame}
          style={{ position: 'absolute', bottom: '2vw', right: '2vw', zIndex: 100 }}
        >
          Sair
        </button>
      )}
    </div>
  );
}

export default App;
