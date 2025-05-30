// src/components/Screens/DifficultyScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
import { isCursorOverElement } from '../../App'; // Ou de onde você exportar

function DifficultyScreen({ difficulties, onDifficultySelect, cursorPosition, timeDelay }) {
    const difficultyItemsRef = useRef([]); // Array de refs para cada item de dificuldade
    const [hoveredDifficultyIndex, setHoveredDifficultyIndex] = useState(null);
    const hoverTimeoutRef = useRef(null);

    // Inicializa as refs para cada item de dificuldade
    useEffect(() => {
        difficultyItemsRef.current = difficultyItemsRef.current.slice(0, difficulties.length);
    }, [difficulties]);

    useEffect(() => {
        if (!cursorPosition) {
            if (hoveredDifficultyIndex !== null) setHoveredDifficultyIndex(null);
            return;
        }

        let newHoveredIndex = null;
        for (let i = 0; i < difficulties.length; i++) {
            if (isCursorOverElement(cursorPosition, difficultyItemsRef.current[i])) {
                newHoveredIndex = i;
                break;
            }
        }

        if (newHoveredIndex !== null) {
            if (newHoveredIndex !== hoveredDifficultyIndex) { // Cursor entrou em um novo item
                setHoveredDifficultyIndex(newHoveredIndex);
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

                hoverTimeoutRef.current = setTimeout(() => {
                    onDifficultySelect(difficulties[newHoveredIndex]);
                    setHoveredDifficultyIndex(null); // Reset hover
                }, timeDelay);
            }
        } else { // Cursor não está sobre nenhum item
            if (hoveredDifficultyIndex !== null) { // Estava hoverando antes
                setHoveredDifficultyIndex(null);
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                }
            }
        }
        // Cleanup
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };

    }, [cursorPosition, difficulties, onDifficultySelect, timeDelay, hoveredDifficultyIndex]);

    return (
        <div id="difficulty-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 id="difficulty-title">Escolha a sua dificuldade</h2>
            <ul id="dificuldades" style={{ display: 'flex', gap: '20px', listStyle: 'none', padding: 0 }}>
                {difficulties.map((diff, index) => (
                    <li
                        key={diff.id}
                        ref={el => difficultyItemsRef.current[index] = el}
                        className={hoveredDifficultyIndex === index ? 'hover' : ''}
                        data-nivel={diff.id} // Mantém para compatibilidade com CSS se necessário
                        style={{ padding: '20px', border: '1px solid #ccc', cursor: 'pointer' }} // Estilo básico
                    >
                        {diff.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DifficultyScreen;