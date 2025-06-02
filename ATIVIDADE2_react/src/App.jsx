// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import './index.css';
import HandposeDetector from './components/HandposeDetector/HandposeDetector';
import StartScreen from './components/Screens/StartScreen';
import DifficultyScreen from './components/Screens/DifficultyScreen';
import CountdownScreen from './components/Screens/CountdownScreen'; // Adicionar import
import QuizScreen from './components/Screens/QuizScreen/QuizScreen'; // Adicionar import
import ResultsScreen from './components/Screens/ResultsScreen'; // Adicionar import

// Funções utilitárias (podem ir para src/utils/helpers.js ou similar depois)
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

// Dificuldades (exemplo, você pode buscar isso da API ou definir de outra forma)
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

  // Estados específicos do Quiz
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0); // Erros na rodada atual
  const [timeLeft, setTimeLeft] = useState(15); // Tempo por pergunta
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' }); // type: 'correct', 'incorrect', 'info'
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);

  const timeDelayForAction = 1000; // ms

  // Callback para o HandposeDetector
  const handleHandMove = useCallback((pos, detected) => {
    setCursorPosition(pos);
    setHandDetected(detected);
  }, []);

  // Funções de transição de estado e lógica de jogo
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
    setSelectedDifficulty(difficulty);
    console.log("Dificuldade selecionada:", difficulty, "ID:", difficulty.id); // Verifique se difficulty.id está correto

    try {
      // Substitua pela URL correta se sua API estiver em outro lugar ou porta diferente do frontend
      const response = await fetch(`http://127.0.0.1:8000/api/questions/${difficulty.id}`);

      if (!response.ok) {
        // Trata erros da API, como dificuldade não encontrada (404) ou outros erros do servidor
        const errorData = await response.text(); // Tenta pegar mais detalhes do erro
        console.error('Falha ao buscar perguntas da API:', response.status, errorData);
        alert(`Erro ao carregar perguntas: ${response.status}. Tente outro nível ou mais tarde.`);
        // Talvez voltar para a tela de dificuldade ou mostrar uma mensagem
        // setGameState(GAME_STATES.DIFFICULTY); // Ou manter na tela atual
        setQuestions([]); // Limpa perguntas anteriores
        return; // Interrompe a execução aqui
      }

      const fetchedQuestions = await response.json();
      console.log('Perguntas recebidas da API:', fetchedQuestions);

      setQuestions(fetchedQuestions);

      if (fetchedQuestions && fetchedQuestions.length > 0) {
        setGameState(GAME_STATES.COUNTDOWN);
      } else {
        // Nenhuma pergunta retornada para a dificuldade, mesmo com resposta OK da API
        alert("Nenhuma pergunta encontrada para esta dificuldade!");
        console.warn("Nenhuma pergunta encontrada para esta dificuldade, mas a API respondeu OK.");
        // Você pode querer voltar para a tela de dificuldade ou lidar de outra forma
        // setGameState(GAME_STATES.DIFFICULTY);
        setGameState(GAME_STATES.COUNTDOWN); // Ou prosseguir para o countdown mesmo vazio, para teste
      }
    } catch (error) {
      // Trata erros de rede ou outros erros na chamada fetch
      console.error("Erro crítico ao tentar buscar perguntas:", error);
      alert("Erro de conexão ao buscar perguntas. Verifique se a API está rodando.");
      // setGameState(GAME_STATES.DIFFICULTY); // Volta para seleção
      setQuestions([]); // Limpa perguntas anteriores
    }
  }, [setSelectedDifficulty, setQuestions, setGameState]); // Adicione as dependências corretas ao useCallback

  const handleCountdownEnd = useCallback(() => {
    setCurrentQuestionIndex(0); // Garante que começa da primeira pergunta
    setTimeLeft(15); // Reseta o tempo para a primeira pergunta
    setGameState(GAME_STATES.QUIZ);
  }, []);

  const handleAnswerSelected = useCallback((selectedIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    if (selectedIndex === currentQuestion.correta) {
      setScore(prevScore => prevScore + (currentQuestion.dificuldade + 1)); // Pontuação baseada na dificuldade
      setFeedback({ message: '✅ Correto!', type: 'correct' });
    } else {
      setErrors(prevErrors => prevErrors + 1);
      setFeedback({ message: `❌ Errado! Resposta: ${currentQuestion.opcoes[currentQuestion.correta]}`, type: 'incorrect' });
    }
    setIsFeedbackVisible(true);
    // Lógica para ir para a próxima pergunta ou finalizar o quiz será acionada pelo botão "Próxima" ou tempo/erros
  }, [questions, currentQuestionIndex]);

  const handleNextQuestion = useCallback(() => {
    setIsFeedbackVisible(false);
    if (errors >= 3) {
      setGameState(GAME_STATES.RESULTS);
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setTimeLeft(15); // Reseta o tempo para a nova pergunta
    } else {
      setGameState(GAME_STATES.RESULTS); // Fim do quiz
    }
  }, [currentQuestionIndex, questions.length, errors]);

  const handleTimeUp = useCallback(() => {
    if (gameState !== GAME_STATES.QUIZ) return; //Só age se estiver no quiz
    setErrors(prevErrors => prevErrors + 1);
    const currentQuestion = questions[currentQuestionIndex];
    setFeedback({ message: `⏰ Tempo esgotado! Resposta: ${currentQuestion.opcoes[currentQuestion.correta]}`, type: 'info' });
    setIsFeedbackVisible(true);
    // A lógica para avançar virá do botão "Próxima" que aparecerá com o feedback
  }, [questions, currentQuestionIndex, gameState]);


  const handleExitGame = useCallback(() => {
    // Se estiver no quiz ou resultados, pode voltar para a tela inicial ou de dificuldade
    setGameState(GAME_STATES.RESULTS); // Simplificado: sempre mostra resultados ao sair
  }, []);

  const handleRestartGame = useCallback(() => {
    handleStartGame(); // Reutiliza a lógica de iniciar o jogo
  }, [handleStartGame]);


  const renderCurrentScreen = () => {
    switch (gameState) {
      case GAME_STATES.START:
        return <StartScreen onStartGame={handleStartGame} cursorPosition={cursorPosition} timeDelay={timeDelayForAction} />;
      case GAME_STATES.DIFFICULTY:
        return <DifficultyScreen difficulties={DIFFICULTIES} onDifficultySelect={handleDifficultySelect} cursorPosition={cursorPosition} timeDelay={timeDelayForAction} />;
      case GAME_STATES.COUNTDOWN:
        return <CountdownScreen onCountdownEnd={handleCountdownEnd} />;
      case GAME_STATES.QUIZ:
        if (questions.length === 0 || currentQuestionIndex >= questions.length) {
          // Algum estado inválido, talvez voltar para dificuldade ou mostrar erro
          // Por segurança, voltamos para a dificuldade se não houver perguntas
          setGameState(GAME_STATES.DIFFICULTY);
          return <p>Carregando perguntas ou erro...</p>;
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
            setTimeLeft={setTimeLeft} // Para o QuizScreen controlar seu próprio timer
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
            transition: 'transform 0.1s ease-out' // Pequena transição para suavizar
          }}
        />
      )}
      {/* Botão de Sair Global (exemplo, pode ser específico da tela) */}
      {(gameState === GAME_STATES.QUIZ) && (
        <button
          id="btn-exit" // Use o estilo CSS existente
          onClick={handleExitGame} // Para clique manual, a lógica de gesto seria no QuizScreen
          style={{ position: 'absolute', bottom: '2vw', right: '2vw', zIndex: 100 }}
        >
          Sair
        </button>
      )}
    </div>
  );
}

export default App;