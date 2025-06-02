// src/components/Screens/QuizScreen/QuizScreen.jsx
import React, { useEffect, useRef, useState } from 'react';
import QuestionBlock from './QuestionBlock';
import OptionsBlock from './OptionsBlock';
import StatsDisplay from './StatsDisplay';
import FeedbackDisplay from './FeedbackDisplay';
// Certifique-se de que esta função está acessível
import { isCursorOverElement } from '../../../App'; // Ou de onde quer que a importe

function QuizScreen({
    question,
    onAnswerSelect,
    onNextQuestion,
    onExitGame, // Esta prop já é passada pelo App.jsx
    score,
    errors,
    timeLeft,
    setTimeLeft,
    handDetected,
    cursorPosition,
    timeDelay,
    feedback,
    isFeedbackVisible,
    setIsFeedbackVisible,
    onTimeUp,
    currentQuestionNumber,
    totalQuestions
}) {
    const nextButtonRef = useRef(null);
    const exitButtonRef = useRef(null); // Ref para o botão de sair

    const [isHoveringNext, setIsHoveringNext] = useState(false);
    const [isHoveringExit, setIsHoveringExit] = useState(false); // Estado para hover no botão Sair
    const nextActionTimeoutRef = useRef(null);
    const exitActionTimeoutRef = useRef(null); // Timer para ação do botão Sair

    // Cronômetro da pergunta (sem alterações)
    useEffect(() => {
        if (timeLeft === 0) {
            onTimeUp();
            return;
        }
        if (isFeedbackVisible) return;

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, setTimeLeft, onTimeUp, isFeedbackVisible]);

    // Lógica de hover e ação para o botão "Próxima" (sem alterações)
    useEffect(() => {
        if (!isFeedbackVisible || !cursorPosition || !nextButtonRef.current) {
            if (isHoveringNext) setIsHoveringNext(false);
            return;
        }
        const overNext = isCursorOverElement(cursorPosition, nextButtonRef.current, 20); // Margem
        if (overNext !== isHoveringNext) {
            setIsHoveringNext(overNext);
        }
    }, [cursorPosition, isFeedbackVisible, nextButtonRef, isHoveringNext]);

    useEffect(() => {
        if (isFeedbackVisible && isHoveringNext) {
            console.log(`QuizScreen: Hover sobre "Próxima". Iniciando timer.`);
            if (nextActionTimeoutRef.current) clearTimeout(nextActionTimeoutRef.current);
            nextActionTimeoutRef.current = setTimeout(() => {
                if (isFeedbackVisible && isHoveringNext) {
                    console.log(`QuizScreen: Timer para "Próxima" concluído.`);
                    onNextQuestion();
                    nextActionTimeoutRef.current = null;
                }
            }, timeDelay);
        } else {
            if (nextActionTimeoutRef.current) {
                clearTimeout(nextActionTimeoutRef.current);
                nextActionTimeoutRef.current = null;
            }
        }
        return () => {
            if (nextActionTimeoutRef.current) clearTimeout(nextActionTimeoutRef.current);
        };
    }, [isHoveringNext, isFeedbackVisible, timeDelay, onNextQuestion]);


    // --- LÓGICA PARA O BOTÃO "SAIR" ---
    // Efeito 1 para o botão "Sair": Atualiza o estado isHoveringExit
    useEffect(() => {
        // Só deteta hover se houver cursor e a ref do botão estiver pronta.
        // O botão Sair está sempre visível durante o Quiz (não depende de isFeedbackVisible).
        if (!cursorPosition || !exitButtonRef.current) {
            if (isHoveringExit) setIsHoveringExit(false);
            return;
        }

        const overExit = isCursorOverElement(cursorPosition, exitButtonRef.current, 20); // Margem

        if (overExit !== isHoveringExit) {
            console.log(`QuizScreen: Cursor ${overExit ? 'ENTROU' : 'SAIU'} da área do botão Sair.`);
            setIsHoveringExit(overExit);
        }
    }, [cursorPosition, exitButtonRef, isHoveringExit]); // Adicionado exitButtonRef

    // Efeito 2 para o botão "Sair": Gerencia o timer e a ação de clique
    useEffect(() => {
        if (isHoveringExit) {
            console.log(`QuizScreen: Hover ATIVADO no botão Sair. A iniciar timer de ${timeDelay}ms.`);
            if (exitActionTimeoutRef.current) clearTimeout(exitActionTimeoutRef.current);
            exitActionTimeoutRef.current = setTimeout(() => {
                // Verifica novamente se ainda está em hover antes de disparar
                if (isHoveringExit) {
                    console.log("QuizScreen: Timer CONCLUÍDO para Sair! A chamar onExitGame.");
                    onExitGame(); // Chama a função passada pelo App.jsx
                    setIsHoveringExit(false); // Desativa o hover após a ação
                    exitActionTimeoutRef.current = null;
                }
            }, timeDelay);
        } else {
            // Se não está em hover, garante que qualquer timer pendente seja limpo
            if (exitActionTimeoutRef.current) {
                console.log("QuizScreen: Hover DESATIVADO no botão Sair. A limpar timer existente.");
                clearTimeout(exitActionTimeoutRef.current);
                exitActionTimeoutRef.current = null;
            }
        }

        return () => {
            if (exitActionTimeoutRef.current) {
                clearTimeout(exitActionTimeoutRef.current);
                exitActionTimeoutRef.current = null;
            }
        };
    }, [isHoveringExit, timeDelay, onExitGame]);
    // --- FIM DA LÓGICA PARA O BOTÃO "SAIR" ---


    if (!question) {
        return <p>Carregando pergunta...</p>;
    }

    return (
        <div id="quiz-container" style={{ display: 'block' }}>
            <div id="header-container">
                <QuestionBlock text={question.pergunta} />
                <StatsDisplay
                    score={score}
                    errors={errors}
                    timeLeft={timeLeft}
                    handDetected={handDetected}
                    currentQuestionNumber={currentQuestionNumber}
                    totalQuestions={totalQuestions}
                />
            </div>

            <OptionsBlock
                options={question.opcoes}
                correta={question.correta}
                onOptionSelect={onAnswerSelect}
                cursorPosition={cursorPosition}
                timeDelay={timeDelay}
                isFeedbackVisible={isFeedbackVisible}
                difficulty={question.dificuldade}
            />

            {isFeedbackVisible && (
                <FeedbackDisplay
                    message={feedback.message}
                    type={feedback.type}
                    onNextButtonRef={nextButtonRef}
                    isHoveringNext={isHoveringNext}
                />
            )}

            <div id="info-abaixo-opcoes">
                <div id="disciplina-block">{question.disciplina}</div>
                <div id="dificuldade-block">Nível: {['Fácil', 'Médio', 'Difícil', 'Aleatório'][question.dificuldade] || 'N/A'}</div>
            </div>

            {/* Renderiza o botão Sair aqui, dentro do QuizScreen */}
            <button
                ref={exitButtonRef}
                id="btn-exit" // Para usar o seu estilo CSS existente
                className={isHoveringExit ? 'hover' : ''}
                // O onClick manual ainda pode ser útil para testes, mas a ação principal é por gesto
                onClick={() => { console.log("QuizScreen: Botão Sair clicado manualmente."); onExitGame(); }}
                style={{ 
                    position: 'absolute', 
                    bottom: '2vw', 
                    right: '2vw', 
                    zIndex: 70 // z-index do seu CSS para btn-exit é 7. Pode ajustar se necessário.
                               // Deve ser menor que o do feedback (10) ou cursor (9999)
                               // mas visível.
                }}
            >
                Sair
            </button>
        </div>
    );
}

export default QuizScreen;
