// src/components/Screens/StartScreen.jsx
import React, { useRef, useEffect, useState } from 'react';

// Função helper para verificar se o cursor está sobre um elemento
// (Você pode colocar isso em um arquivo utils.js)
function isCursorOverElement(cursorPos, element, margin = 0) {
    if (!cursorPos || !element) return false;
    const rect = element.getBoundingClientRect();
    return (
        cursorPos.x >= rect.left - margin &&
        cursorPos.x <= rect.right + margin &&
        cursorPos.y >= rect.top - margin &&
        cursorPos.y <= rect.bottom + margin
    );
}

function StartScreen({ onStartGame, cursorPosition, timeDelay }) {
    const startButtonRef = useRef(null);
    const [isHoveringStart, setIsHoveringStart] = useState(false);
    const hoverTimeoutRef = useRef(null);

    useEffect(() => {
        if (!cursorPosition || !startButtonRef.current) {
            if (isHoveringStart) setIsHoveringStart(false); // Reset hover se o cursor sumir
            return;
        }

        const overStart = isCursorOverElement(cursorPosition, startButtonRef.current);

        if (overStart) {
            if (!isHoveringStart) { // Entrou no hover agora
                setIsHoveringStart(true);
                // Limpar timeout anterior, se houver
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                    console.log("Botão Iniciar 'clicado' por gesto!");
                    onStartGame();
                    setIsHoveringStart(false); // Reset após ação
                }, timeDelay);
            }
        } else {
            if (isHoveringStart) { // Saiu do hover
                setIsHoveringStart(false);
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                }
            }
        }

        // Cleanup timeout se o componente desmontar ou cursorPosition mudar antes do timeout
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [cursorPosition, onStartGame, timeDelay, isHoveringStart]);


    return (
        <div className="control-panel" /* style={{ display: 'flex' }} */ > {/* O App.jsx controla a visibilidade geral da tela */}
            <button
                ref={startButtonRef}
                id="btn-iniciar-react" // Use novos IDs ou confie nas refs
                className={isHoveringStart ? 'hover' : ''} // Aplica a classe .hover do seu CSS
            >
                Iniciar
            </button>
        </div>
    );
}

export default StartScreen;