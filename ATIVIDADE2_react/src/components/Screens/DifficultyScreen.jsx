// src/components/Screens/DifficultyScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
import { isCursorOverElement } from '../../App'; // Certifique-se que o caminho está correto ou defina/importe de utils

function DifficultyScreen({ difficulties, onDifficultySelect, cursorPosition, timeDelay }) {
    const difficultyItemsRef = useRef([]); // Array de refs para cada item de dificuldade
    const [hoveredDifficultyIndex, setHoveredDifficultyIndex] = useState(null); // Índice do item em hover
    const hoverTimeoutRef = useRef(null); // Ref para o ID do timer

    // Garante que o array de refs tenha o tamanho correto
    useEffect(() => {
        difficultyItemsRef.current = difficultyItemsRef.current.slice(0, difficulties.length);
    }, [difficulties]);

    // Efeito 1: Atualiza qual item de dificuldade está em hover
    useEffect(() => {
        if (!cursorPosition) {
            // Se não há cursor, nenhum item está em hover
            if (hoveredDifficultyIndex !== null) setHoveredDifficultyIndex(null);
            return;
        }

        let newHoveredIdx = null;
        for (let i = 0; i < difficulties.length; i++) {
            // Verifica se o ref existe e se o cursor está sobre o elemento
            if (difficultyItemsRef.current[i] && isCursorOverElement(cursorPosition, difficultyItemsRef.current[i])) {
                newHoveredIdx = i;
                break; // Encontrou o item em hover
            }
        }

        // Atualiza o estado SOMENTE se o índice em hover realmente mudou
        // Isso evita que o segundo useEffect (do timer) seja acionado desnecessariamente
        // se o cursor se mover DENTRO do mesmo item.
        if (newHoveredIdx !== hoveredDifficultyIndex) {
            setHoveredDifficultyIndex(newHoveredIdx);
        }
    }, [cursorPosition, difficulties, hoveredDifficultyIndex, difficultyItemsRef]); // Adicionado difficultyItemsRef como dependência (é estável)

    // Efeito 2: Gerencia o timer de "clique por permanência" baseado no item em hover
    useEffect(() => {
        // Se um item está em hover (hoveredDifficultyIndex não é null)
        if (hoveredDifficultyIndex !== null) {
            console.log(`DifficultyScreen: Hover sobre o item ${difficulties[hoveredDifficultyIndex]?.label}. Iniciando timer de ${timeDelay}ms.`);
            hoverTimeoutRef.current = setTimeout(() => {
                // Verifica novamente se ainda estamos hoverando o mesmo índice e se difficulties[hoveredDifficultyIndex] existe
                // Isso é uma pequena segurança caso o estado mude muito rapidamente.
                if (hoveredDifficultyIndex !== null && difficulties[hoveredDifficultyIndex]) {
                    console.log(`DifficultyScreen: Timer concluído para ${difficulties[hoveredDifficultyIndex]?.label}. Selecionando...`);
                    onDifficultySelect(difficulties[hoveredDifficultyIndex]);
                    setHoveredDifficultyIndex(null); // Reseta o hover após a seleção para evitar re-seleção acidental
                    hoverTimeoutRef.current = null; // Limpa a ref do timer
                }
            }, timeDelay);
        }

        // Função de limpeza para este useEffect:
        // Será chamada se hoveredDifficultyIndex mudar (ex: para null ou outro índice),
        // ou se o componente for desmontado, ou se timeDelay/onDifficultySelect/difficulties mudarem.
        return () => {
            if (hoverTimeoutRef.current) {
                console.log("DifficultyScreen: Limpando timer.");
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        };
    }, [hoveredDifficultyIndex, timeDelay, onDifficultySelect, difficulties]); // Dependências deste efeito

    return (
        <div id="difficulty-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
            <h2 id="difficulty-title" style={{ marginBottom: '2rem' }}>Escolha a sua dificuldade</h2>
            <ul id="dificuldades" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '20px', listStyle: 'none', padding: 0, flexWrap: 'wrap' }}>
                {difficulties.map((diff, index) => (
                    <li
                        key={diff.id}
                        ref={el => difficultyItemsRef.current[index] = el}
                        className={`difficulty-item ${hoveredDifficultyIndex === index ? 'hover' : ''}`} // Adicionando classe base para estilização
                        data-nivel={diff.id}
                        style={{ // Mantenha seus estilos ou mova para CSS
                            padding: '20px 40px',
                            border: '2px solid #ccc',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '1.1em',
                            transition: 'transform 0.2s ease, background-color 0.2s ease' // Para o efeito hover do CSS
                        }}
                    // Adicionar onClick para teste com mouse é útil:
                    // onClick={() => onDifficultySelect(diff)}
                    >
                        {diff.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DifficultyScreen;