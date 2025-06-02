// src/components/Screens/QuizScreen/QuizScreen.jsx
import React, { useEffect, useRef, useState } from 'react';
import QuestionBlock from './QuestionBlock';
import OptionsBlock from './OptionsBlock';
import StatsDisplay from './StatsDisplay';
import FeedbackDisplay from './FeedbackDisplay';
import { isCursorOverElement } from '../../../App';

function QuizScreen({
    question,
    onAnswerSelect,
    onNextQuestion,
    onExitGame,
    score,
    errors,
    timeLeft,
    setTimeLeft, // Recebe a função para atualizar o tempo
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
    const exitButtonRef = useRef(null); // Ref para o botão de sair desta tela, se diferente do global

    const [isHoveringNext, setIsHoveringNext] = useState(false);
    const [isHoveringExit, setIsHoveringExit] = useState(false);
    const nextActionTimeoutRef = useRef(null);
    const exitActionTimeoutRef = useRef(null);

    // Cronômetro da pergunta
    useEffect(() => {
        if (timeLeft === 0) {
            onTimeUp(); // Avisa o App que o tempo acabou
            return;
        }
        if (isFeedbackVisible) return; // Pausa o cronômetro se o feedback estiver visível

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, setTimeLeft, onTimeUp, isFeedbackVisible]);


    // Lógica de hover para o botão "Próxima" (que só aparece com o feedback)
    // Efeito 1 para o botão "Próxima": Atualiza o estado isHoveringNext
    useEffect(() => {
        // Só faz sentido detectar hover se o feedback (e o botão "Próxima") estiver visível,
        // se houver posição do cursor e se a ref do botão estiver pronta.
        if (!isFeedbackVisible || !cursorPosition || !nextButtonRef.current) {
            if (isHoveringNext) setIsHoveringNext(false); // Garante que o hover seja desativado
            return;
        }

        const overNext = isCursorOverElement(cursorPosition, nextButtonRef.current);

        // Atualiza o estado de hover SOMENTE se ele realmente mudou
        if (overNext !== isHoveringNext) {
            setIsHoveringNext(overNext);
        }
    }, [cursorPosition, isFeedbackVisible, nextButtonRef, isHoveringNext]); // Adicionado nextButtonRef aqui

    // Efeito 2 para o botão "Próxima": Gerencia o timer e a ação de clique
    useEffect(() => {
        // Só inicia o timer se o feedback estiver visível E estiver em hover sobre o botão "Próxima"
        if (isFeedbackVisible && isHoveringNext) {
            console.log(`QuizScreen: Hover sobre "Próxima". Iniciando timer de ${timeDelay}ms.`);
            nextActionTimeoutRef.current = setTimeout(() => {
                // Verifica novamente as condições antes de disparar a ação
                // (o estado poderia ter mudado enquanto o timer estava rodando)
                if (isFeedbackVisible && isHoveringNext) {
                    console.log(`QuizScreen: Timer para "Próxima" concluído. Chamando onNextQuestion.`);
                    onNextQuestion(); // Chama a função para ir para a próxima pergunta
                    // setIsHoveringNext(false); // O primeiro useEffect cuidará de resetar o hover
                    // se o cursor sair ou isFeedbackVisible mudar.
                    nextActionTimeoutRef.current = null;
                }
            }, timeDelay);
        }

        // Função de limpeza para este useEffect
        return () => {
            if (nextActionTimeoutRef.current) {
                console.log(`QuizScreen: Limpando timer do botão "Próxima".`);
                clearTimeout(nextActionTimeoutRef.current);
                nextActionTimeoutRef.current = null;
            }
        };
    }, [isHoveringNext, isFeedbackVisible, timeDelay, onNextQuestion]); // Dependências para a lógica do timer/ação


    // Lógica de hover para o botão "Sair" (se for específico desta tela)
    // Se você estiver usando o botão Sair global do App.jsx, esta lógica pode não ser necessária aqui
    // ou seria para um botão de sair diferente.
    // useEffect(() => {
    //    // ... lógica similar para o botão de sair se ele for controlado por gesto aqui ...
    // }, [cursorPosition, timeDelay, onExitGame, isHoveringExit]);


    if (!question) {
        return <p>Carregando pergunta...</p>;
    }

    return (
        <div id="quiz-container" style={{ display: 'block' }}> {/* Seu CSS controlará o layout */}
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
                correta={question.correta} // Passa o índice da correta
                onOptionSelect={onAnswerSelect}
                cursorPosition={cursorPosition}
                timeDelay={timeDelay}
                isFeedbackVisible={isFeedbackVisible} // Para desabilitar hover nas opções após resposta
                difficulty={question.dificuldade} // para a pontuação
            />

            {isFeedbackVisible && (
                <FeedbackDisplay
                    message={feedback.message}
                    type={feedback.type}
                    onNextButtonRef={nextButtonRef} // Passa a ref para o botão
                    isHoveringNext={isHoveringNext} // Passa o estado de hover
                />
            )}

            {/* Informações abaixo das opções */}
            <div id="info-abaixo-opcoes">
                <div id="disciplina-block">{question.disciplina}</div>
                <div id="dificuldade-block">Nível: {['Fácil', 'Médio', 'Difícil', 'Aleatório'][question.dificuldade] || 'N/A'}</div>
            </div>

            {/* Botão de Sair específico da tela (opcional, se diferente do global) */}
            {/* <button ref={exitButtonRef} onClick={onExitGame} className={isHoveringExit ? 'hover' : ''}>Sair do Quiz</button> */}
        </div>
    );
}

export default QuizScreen;