// src/components/Screens/QuizScreen/FeedbackDisplay.jsx
import React from 'react';

function FeedbackDisplay({ message, type, onNextButtonRef, isHoveringNext }) {
    // O botão "Próxima" agora é parte deste componente
    // A lógica de hover e clique por gesto para ele está no QuizScreen.jsx
    return (
        <div id="feedback-container" className={!message ? 'hidden' : ''}>
            <span id="feedback-message" style={{ color: type === 'correct' ? 'green' : type === 'incorrect' ? 'red' : 'black' }}>
                {message}
            </span>
            <button
                ref={onNextButtonRef} // Recebe a ref do QuizScreen
                id="btn-next"
                className={isHoveringNext ? 'hover' : ''}
            >
                Próxima
            </button>
        </div>
    );
}

export default FeedbackDisplay;