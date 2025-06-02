// src/components/Screens/StartScreen.jsx
import React, { useRef, useEffect, useState } from 'react';

// Sua função helper isCursorOverElement (verifique se está importada ou definida aqui)
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
    const hoverTimeoutRef = useRef(null); // Para guardar o ID do timeout

    // Efeito 1: Gerencia o estado 'isHoveringStart' baseado na posição do cursor
    useEffect(() => {
        // Se não houver cursor ou o botão não estiver pronto, considera que não está hover.
        if (!cursorPosition || !startButtonRef.current) {
            if (isHoveringStart) setIsHoveringStart(false); // Garante que o hover seja desativado
            return;
        }

        const overStart = isCursorOverElement(cursorPosition, startButtonRef.current);

        // Atualiza o estado de hover SOMENTE se ele realmente mudou
        // Isso evita re-execuções desnecessárias do segundo useEffect se o cursor se mover DENTRO do botão
        if (overStart !== isHoveringStart) {
            setIsHoveringStart(overStart);
        }

    }, [cursorPosition, isHoveringStart]); // Depende da posição do cursor e do estado de hover atual

    // Efeito 2: Lida com o timer de ação quando 'isHoveringStart' muda
    useEffect(() => {
        if (isHoveringStart) {
            // Se está em hover, inicia o timer para a ação
            console.log(`StartScreen: Iniciando timer de ${timeDelay}ms para clique.`);
            hoverTimeoutRef.current = setTimeout(() => {
                console.log("StartScreen: Timer concluído! Chamando onStartGame.");
                onStartGame();
                setIsHoveringStart(false); // Desativa o hover após a ação para evitar re-clique imediato
                hoverTimeoutRef.current = null; // Limpa a referência do timer
            }, timeDelay);
        }

        // Função de limpeza para este efeito:
        // Será chamada se 'isHoveringStart' mudar para false ANTES do timer disparar,
        // ou se o componente for desmontado, ou se 'timeDelay' ou 'onStartGame' mudarem.
        return () => {
            if (hoverTimeoutRef.current) {
                console.log("StartScreen: Limpando timer existente.");
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        };
    }, [isHoveringStart, timeDelay, onStartGame]); // Depende do estado de hover e das props timeDelay/onStartGame

    return (
        <div className="control-panel">
            <button
                ref={startButtonRef}
                id="btn-iniciar-react"
                className={isHoveringStart ? 'hover' : ''}
            >
                Iniciar
            </button>
        </div>
    );
}

export default StartScreen;