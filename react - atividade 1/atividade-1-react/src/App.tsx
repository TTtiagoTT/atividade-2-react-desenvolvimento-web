import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useEffect, useRef } from 'react';


function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Aqui entra a lógica do script.js
    // Podemos colocar os imports e o setup do modelo
  }, []);

  return (
    <>
       <h1 id="titulo-projeto">TapQuiz</h1>

  <div id="feedback-container" className="hidden">
    <span id="feedback-message"></span>
    <button id="btn-next">Próxima</button>
  </div>

  <video id="video" autoPlay playsInline></video>
  <canvas id="canvas"></canvas>

  <div className="control-panel">
    <button id="btn-iniciar">Iniciar</button>
  </div>

  <p id="contador-dedos">Dedos levantados: 0</p>

  <div id="quiz-container" style={{display: 'none'}}>
    <div id="header-container">
      <div id="pergunta-block"></div>
      <div id="stats-container">
        <div id="score-block"></div>
        <div id="cronometro-container">
          <span id="cronometro-emoji">⏱️</span>
          <span id="cronometro">15</span>
        </div>
        <div id="erros-block">
          <span id="erros-texto">0/3</span>
        </div>
        <div id="mao-status" className="stats-box"></div>
      </div>
    </div>
    <div id="opcoes-block">
      <ul id="opcoes"></ul>
    </div>
    <div id="info-abaixo-opcoes">
      <div id="disciplina-block">Ciências</div>
      <div id="dificuldade-block">Fácil</div>
    </div>
  </div>

  <div id="difficulty-container" style={{display: 'none'}}>
    <h2 id="difficulty-title">Escolha a sua dificuldade</h2>
    <ul id="dificuldades">
      <li data-nivel="0">Fácil</li>
      <li data-nivel="1">Médio</li>
      <li data-nivel="2">Difícil</li>
      <li data-nivel="3">Aleatório</li>
    </ul>
  </div>

  <div id="bottom-left-bar">
    <button id="btn-exit">Sair</button>
  </div>

  <div id="results-screen" className="hidden">
    <div id="results-content">
      <h2>Resultados Finais</h2>
      <p id="final-score">Pontuação: 0</p>
      <button id="btn-restart">Reiniciar</button>
    </div>
  </div>

  <div id="tela-contagem" className="hidden">
    <h2 id="contador-tela">3</h2>
  </div>

  <script src="script.js"></script>
  <div id="finger-cursor"></div>
    </>
  )
}

export default App
