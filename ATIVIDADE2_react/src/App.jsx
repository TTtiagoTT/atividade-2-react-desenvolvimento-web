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

  // Estados para o feedback da IA
  const [playedQuestionsLog, setPlayedQuestionsLog] = useState([]);
  const [gameFeedback, setGameFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

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
    console.log("App.jsx: Iniciando Jogo. Resetando estados.");
    setScore(0);
    setErrors(0);
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setSelectedDifficulty(null);
    setIsFeedbackVisible(false);
    setPlayedQuestionsLog([]); // Limpa o log de perguntas jogadas
    setGameFeedback(''); // Limpa feedback anterior da IA
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
    setPlayedQuestionsLog([]); // Limpa o log ao selecionar nova dificuldade
    setGameFeedback(''); // Limpa feedback anterior da IA
    setSelectedDifficulty(difficulty);
    setIsLoadingQuestions(true);
    console.log(`App.jsx: Dificuldade selecionada - Label: ${difficulty.label}, ID: ${difficulty.id}. A carregar perguntas...`);

    try {
      const apiUrl = `http://localhost:8000/api/questions/${difficulty.id}`;
      const response = await axios.get(apiUrl);
      const fetchedQuestions = response.data;
      if (fetchedQuestions && fetchedQuestions.length > 0) {
        setQuestions(fetchedQuestions);
        setGameState(GAME_STATES.COUNTDOWN);
      } else {
        alert(`Nenhuma pergunta encontrada para a dificuldade: ${difficulty.label}.`);
        setQuestions([]);
        setGameState(GAME_STATES.DIFFICULTY);
      }
    } catch (error) {
      console.error("App.jsx: Erro ao buscar perguntas da API:", error);
      alert("Falha ao carregar perguntas. Verifique a API e a consola.");
      setGameState(GAME_STATES.DIFFICULTY);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  // Log das perguntas à medida que são apresentadas
  useEffect(() => {
    if (gameState === GAME_STATES.QUIZ && questions.length > 0 && questions[currentQuestionIndex]) {
        const currentQ = questions[currentQuestionIndex];
        // Adiciona ao log apenas se não estiver lá (para evitar duplicados em re-renders)
        setPlayedQuestionsLog(prevLog => {
            if (!prevLog.find(q => q.id === currentQ.id)) { // Assume que as perguntas têm um 'id' único
                console.log("App.jsx: Registando pergunta jogada:", currentQ.pergunta);
                return [...prevLog, { pergunta: currentQ.pergunta, disciplina: currentQ.disciplina, id: currentQ.id }];
            }
            return prevLog;
        });
    }
  }, [currentQuestionIndex, gameState, questions]);


  // Buscar feedback da IA quando o jogo termina
  useEffect(() => {
    if (gameState === GAME_STATES.RESULTS && playedQuestionsLog.length > 0) {
        const fetchFeedbackFromAI = async () => {
            setIsLoadingFeedback(true);
            setGameFeedback(''); 
            console.log("App.jsx: Solicitando feedback da IA para as perguntas:", playedQuestionsLog);
            try {
                const response = await axios.post('http://localhost:8000/api/generate-feedback', {
                    played_questions: playedQuestionsLog.map(q => ({ pergunta: q.pergunta, disciplina: q.disciplina })) // Envia apenas os campos necessários
                });
                setGameFeedback(response.data.feedback_text || "Não foi possível obter um feedback personalizado desta vez.");
                console.log("App.jsx: Feedback da IA recebido:", response.data.feedback_text);
            } catch (error) {
                console.error("App.jsx: Erro ao buscar feedback da IA:", error);
                let errorMessage = "Ocorreu um erro ao tentar obter o feedback personalizado.";
                if (error.response && error.response.data && error.response.data.detail) {
                    errorMessage += ` Detalhe: ${error.response.data.detail}`;
                }
                setGameFeedback(errorMessage);
            } finally {
                setIsLoadingFeedback(false);
            }
        };
        fetchFeedbackFromAI();
    }
  }, [gameState, playedQuestionsLog]); // Executa quando gameState muda para RESULTS e há perguntas logadas


  const handleCountdownEnd = useCallback(() => {
    setCurrentQuestionIndex(0);
    setTimeLeft(15);
    setGameState(GAME_STATES.QUIZ);
  }, []);

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
    const correctAnswerText = currentQuestion?.opcoes?.[currentQuestion.correta] || "N/A";
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
            if (gameState !== GAME_STATES.DIFFICULTY) {
                 setTimeout(() => setGameState(GAME_STATES.DIFFICULTY), 0);
            }
            return <p style={{color: "white", textAlign: "center", fontSize: "1.5em", paddingTop: "20%"}}>Nenhuma pergunta carregada. Por favor, selecione uma dificuldade.</p>;
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
        return <ResultsScreen 
                    score={score} 
                    onRestartGame={handleRestartGame} 
                    cursorPosition={cursorPosition} 
                    timeDelay={timeDelayForAction}
                    gameFeedback={gameFeedback}
                    isLoadingFeedback={isLoadingFeedback}
                />;
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
            transition: 'transform 0.05s ease-out'
          }}
        />
      )}
    </div>
  );
}

export default App;
