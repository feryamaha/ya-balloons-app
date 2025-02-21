import React, { useState, useEffect } from 'react';
import './Game.css';

const shapes = [
    { name: 'circle', style: { borderRadius: '50%', clipPath: null } },
    { name: 'square', style: { borderRadius: '0', clipPath: null } },
    { name: 'triangle', style: { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', borderRadius: '0' } },
    { name: 'diamond', style: { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', borderRadius: '0' } },
    { name: 'pentagon', style: { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', borderRadius: '0' } }
];

function getRandomColor() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomShape() {
    return shapes[Math.floor(Math.random() * shapes.length)];
}

let audioContext = null;
let plockBuffer = null;

async function fetchComplementaryColor(hex) {
    try {
        const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex.slice(1)}`);
        const data = await response.json();
        return data.complementary.hex.value;
    } catch (error) {
        return getRandomColor();
    }
}

function Game() {
    const [balloons, setBalloons] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
        async function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const response = await fetch('/assets/sounds/plock.m4a');
                const arrayBuffer = await response.arrayBuffer();
                plockBuffer = await audioContext.decodeAudioData(arrayBuffer);
                console.log('Áudio carregado');
            }
        }

        const handleInteraction = () => {
            initAudio();
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);

        const initialBalloons = Array.from({ length: 5 }, createBalloonData);
        setBalloons(initialBalloons);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    function createBalloonData() {
        const size = Math.random() * 50 + 50;
        return {
            id: Date.now() + Math.random(),
            shape: getRandomShape(),
            color: getRandomColor(),
            x: Math.random() * (window.innerWidth - size),
            y: Math.random() * (window.innerHeight - size),
            size,
            popped: false
        };
    }

    function playPlockSound() {
        if (!audioContext || !plockBuffer) return;
        const source = audioContext.createBufferSource();
        source.buffer = plockBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    async function popBalloon(id, initialColor) {
        const newColor = await fetchComplementaryColor(initialColor);
        setBalloons(prev =>
            prev.map(b =>
                b.id === id ? { ...b, color: newColor, popped: true } : b
            )
        );
        playPlockSound();
        setScore(prev => prev + 1);

        setTimeout(() => {
            setBalloons(prev => {
                const newBalloons = prev.filter(b => b.id !== id);
                return [...newBalloons, createBalloonData()];
            });
        }, 500);
    }

    return (
        <>
            <div id="score">Balões Estourados: {score}</div>
            {balloons.map(balloon => (
                <div
                    key={balloon.id}
                    className={`balloon ${balloon.popped ? 'popped' : ''}`}
                    style={{
                        left: `${balloon.x}px`,
                        top: `${balloon.y}px`,
                        width: `${balloon.size}px`,
                        height: `${balloon.size}px`,
                        backgroundColor: balloon.color,
                        borderRadius: balloon.shape.style.borderRadius || '0',
                        clipPath: balloon.shape.style.clipPath || null
                    }}
                    onClick={() => popBalloon(balloon.id, balloon.color)}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        popBalloon(balloon.id, balloon.color);
                    }}
                />
            ))}
        </>
    );
}

export default Game;