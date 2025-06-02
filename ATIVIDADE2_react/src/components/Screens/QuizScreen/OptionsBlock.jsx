// src/components/Screens/QuizScreen/OptionsBlock.jsx
import React, { useRef, useEffect, useState } from 'react';
import { isCursorOverElement } from '../../../App';

function OptionsBlock({ options, onOptionSelect, cursorPosition, timeDelay, isFeedbackVisible, correta, difficulty }) {
    const optionItemsRef = useRef([]);
    const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);
    const hoverTimeoutRef = useRef(null);

    // Garante que o array de refs tenha o tamanho correto
    useEffect(() => {
        optionItemsRef.current = optionItemsRef.current.slice(0, options.length);
    }, [options]);

    // Efeito 1: Atualiza qual opção está em hover
    // Este efeito considera se o feedback está visível para desabilitar o hover.
    useEffect(() => {
        // Se o feedback está visível, ou não há cursor, ou não há refs, nenhum item deve estar em hover.
        if (isFeedbackVisible || !cursorPosition || optionItemsRef.current.length === 0) {
            if (hoveredOptionIndex !== null) {
                setHoveredOptionIndex(null);
            }
            return;
        }

        let newHoveredIdx = null;
        for (let i = 0; i < options.length; i++) {
            if (optionItemsRef.current[i] && isCursorOverElement(cursorPosition, optionItemsRef.current[i])) {
                newHoveredIdx = i;
                break;
            }
        }

        // Atualiza o estado de hover SOMENTE se o índice realmente mudou
        if (newHoveredIdx !== hoveredOptionIndex) {
            setHoveredOptionIndex(newHoveredIdx);
        }
    }, [cursorPosition, options, hoveredOptionIndex, isFeedbackVisible, optionItemsRef]); // Adicionado optionItemsRef aqui

    // Efeito 2: Gerencia o timer para o "clique" por permanência
    useEffect(() => {
        // Se o feedback está visível, ou nenhum item está em hover, limpa qualquer timer e não faz nada.
        if (isFeedbackVisible || hoveredOptionIndex === null) {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
            return;
        }

        // Se um item está em hover (e o feedback não está visível)
        console.log(`OptionsBlock: Hover sobre a opção índice ${hoveredOptionIndex}. Iniciando timer de ${timeDelay}ms.`);
        hoverTimeoutRef.current = setTimeout(() => {
            // Verifica novamente se o feedback não apareceu enquanto o timer rodava
            // e se o índice ainda é válido.
            if (!isFeedbackVisible && hoveredOptionIndex !== null && options[hoveredOptionIndex] !== undefined) {
                console.log(`OptionsBlock: Timer concluído para índice ${hoveredOptionIndex}. Selecionando:`, options[hoveredOptionIndex]);
                onOptionSelect(hoveredOptionIndex); // Chama a função para selecionar a opção
                // Não é necessário setHoveredOptionIndex(null) aqui, pois onOptionSelect
                // provavelmente mudará isFeedbackVisible, o que já limpará o hover no primeiro useEffect.
                hoverTimeoutRef.current = null;
            }
        }, timeDelay);

        // Função de limpeza para este useEffect
        return () => {
            if (hoverTimeoutRef.current) {
                console.log("OptionsBlock: Limpando timer.");
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        };
    }, [hoveredOptionIndex, timeDelay, onOptionSelect, options, isFeedbackVisible]); // Adicionado isFeedbackVisible aqui

    return (
        <div id="opcoes-block">
            <ul id="opcoes">
                {options.map((option, index) => (
                    <li
                        key={index}
                        ref={el => optionItemsRef.current[index] = el}
                        className={`${hoveredOptionIndex === index ? 'hover' : ''} ${isFeedbackVisible && index === correta ? 'correct-answer-highlight' : ''} ${isFeedbackVisible && hoveredOptionIndex === index && index !== correta ? 'incorrect-answer-highlight' : ''}`}
                        data-index={index}
                    >
                        {option}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default OptionsBlock;