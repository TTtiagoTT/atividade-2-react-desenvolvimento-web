// src/components/Screens/CountdownScreen.jsx
import React, { useState, useEffect } from 'react';

function CountdownScreen({ onCountdownEnd }) {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count === 0) {
            onCountdownEnd();
            return;
        }

        const timerId = setInterval(() => {
            setCount(prevCount => prevCount - 1);
        }, 1000);

        return () => clearInterval(timerId); // Cleanup do intervalo
    }, [count, onCountdownEnd]);

    return (
        <div id="tela-contagem" /* Sua classe CSS para estilizar */ >
            <h2 id="contador-tela">{count > 0 ? count : "Iniciando!"}</h2>
        </div>
    );
}

export default CountdownScreen;