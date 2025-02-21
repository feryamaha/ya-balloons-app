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

function getRandomChromaticColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 70%)`; // Brilho aumentado de 60% pra 70% pra cores mais vivas
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

async function initializeAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext criado');
    }
    if (!plockBuffer) {
        console.log('Tentando carregar áudio de: /assets/sounds/pop.mp3');
        try {
            const response = await fetch('/assets/sounds/pop.mp3');
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
            }
            const contentType = response.headers.get('Content-Type');
            console.log('Tipo de conteúdo recebido:', contentType);
            if (!contentType || !contentType.includes('audio/')) {
                throw new Error('O servidor retornou algo que não é áudio');
            }
            const arrayBuffer = await response.arrayBuffer();
            console.log('ArrayBuffer recebido, decodificando...');
            plockBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log('Áudio carregado com sucesso');
        } catch (error) {
            console.error('Falha ao carregar pop.mp3:', error);
        }
    }
}

function Game() {
    const [balloons, setBalloons] = useState([]);
    const [score, setScore] = useState(0);
    const [audioLoaded, setAudioLoaded] = useState(false);

    useEffect(() => {
        const initialBalloons = Array.from({ length: 5 }, createBalloonData);
        setBalloons(initialBalloons);

        const animationInterval = setInterval(() => {
            setBalloons(prev => {
                const updatedBalloons = prev.map(balloon => ({
                    ...balloon,
                    y: balloon.y - 3
                })).filter(balloon => balloon.y > -balloon.size);
                if (updatedBalloons.length < 5) {
                    return [...updatedBalloons, createBalloonData()];
                }
                return updatedBalloons;
            });
        }, 50);

        return () => {
            clearInterval(animationInterval);
        };
    }, []);

    const handleInteraction = async () => {
        if (!audioLoaded) {
            await initializeAudio();
            setAudioLoaded(true);
        }
    };

    function createBalloonData() {
        const size = Math.random() * 60 + 60; // 60-120px
        return {
            id: Date.now() + Math.random(),
            shape: getRandomShape(),
            color: getRandomColor(),
            x: Math.random() * (window.innerWidth - size),
            y: window.innerHeight,
            size,
            popped: false
        };
    }

    function playPlockSound() {
        if (!audioContext || !plockBuffer) {
            console.warn('Áudio não reproduzido: contexto ou buffer não pronto');
            return;
        }
        const source = audioContext.createBufferSource();
        source.buffer = plockBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        console.log('Som "pop" reproduzido');
    }

    const createBubbleParticles = (x, y) => {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'bubble-particle';
            const size = Math.random() * 80 + 40;
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 120 + 40;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;

            particle.style.left = `${x + offsetX}px`;
            particle.style.top = `${y + offsetY}px`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = `radial-gradient(circle, ${getRandomChromaticColor()} 30%, transparent 80%)`; // Gradiente mais forte
            particle.style.opacity = '1'; // Opacidade máxima pra mais força
            document.body.appendChild(particle);

            setTimeout(() => {
                particle.style.transition = 'all 2.5s ease-out';
                particle.style.opacity = '0';
                particle.style.transform = `translate(${offsetX * 0.7}px, ${offsetY * 0.7 - 40}px) scale(0.5)`;
                setTimeout(() => particle.remove(), 2500);
            }, 50);

            setTimeout(() => {
                const subParticleCount = 3;
                for (let j = 0; j < subParticleCount; j++) {
                    const subParticle = document.createElement('div');
                    subParticle.className = 'bubble-particle';
                    const subSize = size * 0.5;
                    const subAngle = Math.random() * 2 * Math.PI;
                    const subDistance = Math.random() * 40 + 20;
                    const subOffsetX = Math.cos(subAngle) * subDistance;
                    const subOffsetY = Math.sin(subAngle) * subDistance;

                    subParticle.style.left = `${x + offsetX}px`;
                    subParticle.style.top = `${y + offsetY}px`;
                    subParticle.style.width = `${subSize}px`;
                    subParticle.style.height = `${subSize}px`;
                    subParticle.style.background = `radial-gradient(circle, ${getRandomChromaticColor()} 30%, transparent 80%)`;
                    subParticle.style.opacity = '1'; // Opacidade máxima
                    document.body.appendChild(subParticle);

                    setTimeout(() => {
                        subParticle.style.transition = 'all 1.8s ease-out';
                        subParticle.style.opacity = '0';
                        subParticle.style.transform = `translate(${subOffsetX}px, ${subOffsetY - 25}px) scale(0.3)`;
                        setTimeout(() => subParticle.remove(), 1800);
                    }, 50);
                }
            }, 300);
        }
    };

    async function popBalloon(id, initialColor) {
        const balloon = balloons.find(b => b.id === id);
        if (balloon) {
            const newColor = await fetchComplementaryColor(initialColor);
            setBalloons(prev =>
                prev.map(b =>
                    b.id === id ? { ...b, color: newColor, popped: true } : b
                )
            );
            createBubbleParticles(balloon.x + balloon.size / 2, balloon.y + balloon.size / 2);
            playPlockSound();
            setScore(prev => prev + 1);

            setTimeout(() => {
                setBalloons(prev => prev.filter(b => b.id !== id));
            }, 500);
        }
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
                    onClick={async () => {
                        await handleInteraction();
                        popBalloon(balloon.id, balloon.color);
                    }}
                    onTouchStart={async (e) => {
                        e.preventDefault();
                        await handleInteraction();
                        popBalloon(balloon.id, balloon.color);
                    }}
                />
            ))}
        </>
    );
}

export default Game;