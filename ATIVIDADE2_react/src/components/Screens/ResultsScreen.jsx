// src/components/Screens/ResultsScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
// Certifique-se de que esta função está acessível.
// Pode importá-la do App.jsx ou de um ficheiro utils.
import { isCursorOverElement } from '../../App';

function ResultsScreen({ score, onRestartGame, cursorPosition, timeDelay }) {
    const restartButtonRef = useRef(null);
    const [isHoveringRestart, setIsHoveringRestart] = useState(false);
    const hoverTimeoutRef = useRef(null);

    // Efeito 1: Atualiza o estado 'isHoveringRestart' baseado na posição do cursor
    useEffect(() => {
        if (!cursorPosition || !restartButtonRef.current) {
            if (isHoveringRestart) setIsHoveringRestart(false);
            return;
        }

        const overRestart = isCursorOverElement(cursorPosition, restartButtonRef.current, 20); // Adicionada margem

        if (overRestart !== isHoveringRestart) {
            // Log para quando o estado de hover muda
            console.log(`ResultsScreen: Cursor ${overRestart ? 'ENTROU' : 'SAIU'} da área do botão Reiniciar.`);
            setIsHoveringRestart(overRestart);
        }

        // Logs para depuração contínua da posição e do retângulo do botão
        // Remova ou comente após a depuração para não poluir a consola
        const buttonRect = restartButtonRef.current.getBoundingClientRect();
        // console.log("ResultsScreen - Cursor:", cursorPosition, "Botão Rect:", buttonRect, "isOver:", overRestart);


    }, [cursorPosition, isHoveringRestart]); // Depende da posição do cursor e do estado de hover atual

    // Efeito 2: Lida com o timer de ação quando 'isHoveringRestart' muda
    useEffect(() => {
        if (isHoveringRestart) {
            console.log(`ResultsScreen: Hover ATIVADO no botão Reiniciar. A iniciar timer de ${timeDelay}ms.`);
            if (hoverTimeoutRef.current) { // Limpa qualquer timer anterior (segurança)
                clearTimeout(hoverTimeoutRef.current);
            }
            hoverTimeoutRef.current = setTimeout(() => {
                console.log("ResultsScreen: Timer CONCLUÍDO para Reiniciar! A chamar onRestartGame.");
                onRestartGame();
                setIsHoveringRestart(false); // Desativa o hover após a ação
                hoverTimeoutRef.current = null;
            }, timeDelay);
        } else {
            // Se não está em hover, garante que qualquer timer pendente seja limpo
            if (hoverTimeoutRef.current) {
                console.log("ResultsScreen: Hover DESATIVADO no botão Reiniciar. A limpar timer existente.");
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        }

        // Função de limpeza para este efeito
        return () => {
            if (hoverTimeoutRef.current) {
                console.log("ResultsScreen: Limpando timer (cleanup do useEffect).");
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        };
    }, [isHoveringRestart, timeDelay, onRestartGame]);

    return (
        <div id="results-screen" style={{ display: 'flex' }}>
            <div id="results-content">
                <h2>Resultados Finais</h2>
                <p id="final-score">Pontuação: {score}</p>
                <button
                    ref={restartButtonRef}
                    id="btn-restart" // O seu CSS usa este ID para o hover visual
                    className={isHoveringRestart ? 'hover' : ''} // Aplica a classe .hover do seu CSS
                >
                    Reiniciar
                </button>
            </div>
        </div>
    );
}

export default ResultsScreen;
