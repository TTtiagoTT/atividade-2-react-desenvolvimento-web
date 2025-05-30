// src/components/Screens/ResultsScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
import { isCursorOverElement } from '../../App'; // Ajuste o caminho

function ResultsScreen({ score, onRestartGame, cursorPosition, timeDelay }) {
    const restartButtonRef = useRef(null);
    const [isHoveringRestart, setIsHoveringRestart] = useState(false);
    const hoverTimeoutRef = useRef(null);

    useEffect(() => {
        if (!cursorPosition || !restartButtonRef.current) {
            if (isHoveringRestart) setIsHoveringRestart(false);
            return;
        }

        const overRestart = isCursorOverElement(cursorPosition, restartButtonRef.current);

        if (overRestart) {
            if (!isHoveringRestart) {
                setIsHoveringRestart(true);
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                    onRestartGame();
                    setIsHoveringRestart(false);
                }, timeDelay);
            }
        } else {
            if (isHoveringRestart) {
                setIsHoveringRestart(false);
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }
        }
        return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
    }, [cursorPosition, onRestartGame, timeDelay, isHoveringRestart]);

    return (
        <div id="results-screen" style={{ display: 'flex' }}> {/* Seu CSS controlará a visibilidade e estilo */}
            <div id="results-content">
                <h2>Resultados Finais</h2>
                <p id="final-score">Pontuação: {score}</p>
                <button
                    ref={restartButtonRef}
                    id="btn-restart"
                    className={isHoveringRestart ? 'hover' : ''}
                >
                    Reiniciar
                </button>
            </div>
        </div>
    );
}

export default ResultsScreen;