// src/components/Screens/ResultsScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
import { isCursorOverElement } from '../../App'; // Ajuste o caminho se moveu a função

function ResultsScreen({ 
    score, 
    onRestartGame, 
    cursorPosition, 
    timeDelay,
    gameFeedback,         // Nova prop
    isLoadingFeedback     // Nova prop
}) {
    const restartButtonRef = useRef(null);
    const [isHoveringRestart, setIsHoveringRestart] = useState(false);
    const hoverTimeoutRef = useRef(null);

    // Efeito para o estado de hover do botão Reiniciar
    useEffect(() => {
        if (!cursorPosition || !restartButtonRef.current) {
            if (isHoveringRestart) setIsHoveringRestart(false);
            return;
        }
        const overRestart = isCursorOverElement(cursorPosition, restartButtonRef.current, 20);
        if (overRestart !== isHoveringRestart) {
            setIsHoveringRestart(overRestart);
        }
    }, [cursorPosition, isHoveringRestart]);

    // Efeito para a ação do botão Reiniciar
    useEffect(() => {
        if (isHoveringRestart) {
            console.log(`ResultsScreen: Hover ATIVADO no botão Reiniciar. A iniciar timer de ${timeDelay}ms.`);
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = setTimeout(() => {
                if (isHoveringRestart) { // Verifica novamente se ainda está em hover
                    console.log("ResultsScreen: Timer CONCLUÍDO para Reiniciar! A chamar onRestartGame.");
                    onRestartGame();
                    setIsHoveringRestart(false);
                    hoverTimeoutRef.current = null;
                }
            }, timeDelay);
        } else {
            if (hoverTimeoutRef.current) {
                console.log("ResultsScreen: Hover DESATIVADO no botão Reiniciar. A limpar timer.");
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        }
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, [isHoveringRestart, timeDelay, onRestartGame]);

    return (
        <div id="results-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <div id="results-content" style={{background: 'white', padding: '2em', borderRadius: '12px', textAlign: 'center', color: '#333'}}>
                <h2>Resultados Finais</h2>
                <p id="final-score" style={{fontSize: '1.5em', marginBottom: '1.5em'}}>Pontuação: {score}</p>
                
                {/* Secção para o Feedback da IA */}
                <div id="ai-feedback-section" style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h3 style={{marginTop: 0, color: '#555'}}>Feedback Personalizado:</h3>
                    {isLoadingFeedback && <p>A gerar o seu feedback personalizado, aguarde...</p>}
                    {!isLoadingFeedback && gameFeedback && <p style={{textAlign: 'left', whiteSpace: 'pre-wrap'}}>{gameFeedback}</p>}
                    {!isLoadingFeedback && !gameFeedback && <p>Não foi possível carregar o feedback desta vez.</p>}
                </div>

                <button
                    ref={restartButtonRef}
                    id="btn-restart" // O seu CSS usa este ID para o hover visual
                    className={isHoveringRestart ? 'hover' : ''} // Aplica a classe .hover do seu CSS
                    style={{ // Estilo básico, pode ser ajustado pelo seu CSS
                        background: '#12c2e9',
                        color: 'white',
                        fontSize: '1.2em',
                        padding: '0.8em 1.5em',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Reiniciar
                </button>
            </div>
        </div>
    );
}

export default ResultsScreen;
