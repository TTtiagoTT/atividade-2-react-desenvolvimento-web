// src/components/Screens/QuizScreen/OptionsBlock.jsx
import React, { useRef, useEffect, useState } from 'react';
import { isCursorOverElement } from '../../../App'; // Ajuste o caminho

function OptionsBlock({ options, onOptionSelect, cursorPosition, timeDelay, isFeedbackVisible, correta, difficulty }) {
    const optionItemsRef = useRef([]);
    const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);
    const hoverTimeoutRef = useRef(null);

    useEffect(() => {
        optionItemsRef.current = optionItemsRef.current.slice(0, options.length);
    }, [options]);

    useEffect(() => {
        // Se o feedback estiver visível, não permitir hover/seleção de novas opções
        if (isFeedbackVisible || !cursorPosition) {
            if (hoveredOptionIndex !== null) setHoveredOptionIndex(null);
            return;
        }

        let newHoveredIndex = null;
        for (let i = 0; i < options.length; i++) {
            if (isCursorOverElement(cursorPosition, optionItemsRef.current[i])) {
                newHoveredIndex = i;
                break;
            }
        }

        if (newHoveredIndex !== null) {
            if (newHoveredIndex !== hoveredOptionIndex) {
                setHoveredOptionIndex(newHoveredIndex);
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

                hoverTimeoutRef.current = setTimeout(() => {
                    onOptionSelect(newHoveredIndex); // Passa o índice da opção selecionada
                    setHoveredOptionIndex(null);
                }, timeDelay);
            }
        } else {
            if (hoveredOptionIndex !== null) {
                setHoveredOptionIndex(null);
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }
        }
        return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
    }, [cursorPosition, options, onOptionSelect, timeDelay, hoveredOptionIndex, isFeedbackVisible]);

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
// Adicione classes CSS para 'correct-answer-highlight' e 'incorrect-answer-highlight' se desejar.
// Exemplo no seu CSS:
// #opcoes li.correct-answer-highlight { background-color: lightgreen; }
// #opcoes li.incorrect-answer-highlight { background-color: lightcoral; }


export default OptionsBlock;