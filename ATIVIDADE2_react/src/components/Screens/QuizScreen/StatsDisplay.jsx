// src/components/Screens/QuizScreen/StatsDisplay.jsx
import React from 'react';

function StatsDisplay({ score, errors, timeLeft, handDetected, currentQuestionNumber, totalQuestions }) {
    let timerColorClass = 'tempo-normal';
    if (timeLeft <= 5) {
        timerColorClass = 'tempo-perigo';
    } else if (timeLeft <= 10) {
        timerColorClass = 'tempo-aviso';
    }

    return (
        <div id="stats-container">
            <div id="score-block">Pontuação: {score}</div>
            <div id="cronometro-container" className={timerColorClass}>
                <span id="cronometro-emoji">⏱️</span>
                <span id="cronometro">{timeLeft}</span>
            </div>
            <div id="mao-status" className="stats-box">Mão: {handDetected ? 'OK' : 'NÃO'}</div>
            <div id="erros-block">
                <span id="erros-texto">{errors}/3</span>
            </div>
            {/* Poderia adicionar: Questão: {currentQuestionNumber}/{totalQuestions} */}
        </div>
    );
}

export default StatsDisplay;