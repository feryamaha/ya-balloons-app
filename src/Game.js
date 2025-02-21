import React, { useState, useEffect } from 'react';
import './Game.css';

const familyImages = [
    'fernando',
    'esposa',
    'anthonella',
    'yasmim',
    'akita',
    'husky'
];

const shapes = [
    { name: 'circle', style: { borderRadius: '50%', clipPath: null } }
];

function getRandomColor() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomChromaticColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 70%)`;
}

function getRandomShape() {
    return shapes[0];
}

function getRandomImage() {
    const baseName = familyImages[Math.floor(Math.random() * familyImages.length)];
    const fullPath = `${process.env.PUBLIC_URL}/assets/images/${baseName}.webp`;
    console.log('Tentando carregar imagem primária:', fullPath);
    return fullPath;
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
            const response = await fetch(`${process.env.PUBLIC_URL}/assets/sounds/pop.mp3`);
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
    const [records, setRecords] = useState({
        '/assets/images/fernando.webp': 0,
        '/assets/images/esposa.webp': 0,
        '/assets/images/anthonella.webp': 0,
        '/assets/images/yasmim.webp': 0,
        '/assets/images/akita.webp': 0,
        '/assets/images/husky.webp': 0
    });

    useEffect(() => {
        const initialBalloons = Array.from({ length: 2 }, () => createBalloonData());
        setBalloons(initialBalloons);

        const animationInterval = setInterval(() => {
            setBalloons(prev => {
                const updatedBalloons = prev.map(balloon => {
                    const speedY = Math.random() * 3 + 2; // Aumentado para 2-5px por frame
                    let speedX = (Math.random() * 2 - 1) * 0.5;

                    let newX = balloon.x + speedX;
                    let newY = balloon.y - speedY;

                    prev.forEach(otherBalloon => {
                        if (otherBalloon.id !== balloon.id && !otherBalloon.popped) {
                            const dx = newX + balloon.size / 2 - (otherBalloon.x + otherBalloon.size / 2);
                            const dy = newY + balloon.size / 2 - (otherBalloon.y + otherBalloon.size / 2);
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const minDistance = balloon.size;

                            if (distance < minDistance) {
                                const angle = Math.atan2(dy, dx);
                                const overlap = minDistance - distance;
                                const pushForce = 1.5;
                                newX -= Math.cos(angle) * overlap * pushForce;
                                newY -= Math.sin(angle) * overlap * pushForce * 0.1;
                                otherBalloon.x += Math.cos(angle) * overlap * pushForce;
                                otherBalloon.y += Math.sin(angle) * overlap * pushForce * 0.1;

                                speedX += (Math.random() * 0.8 - 0.4) * pushForce;
                            }
                        }
                    });

                    newX = Math.max(0, Math.min(newX, window.innerWidth - balloon.size));
                    newY = Math.max(-balloon.size, newY);

                    return {
                        ...balloon,
                        x: newX,
                        y: newY
                    };
                }).filter(balloon => balloon.y > -balloon.size);

                if (updatedBalloons.length < 12 && Math.random() < 0.1) { // Aumentado limite para 12 e probabilidade para 10%
                    const newBalloon = createBalloonData();
                    return [...updatedBalloons, newBalloon];
                }
                return updatedBalloons;
            });
        }, 100);

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
        const size = 48;
        return {
            id: Date.now() + Math.random(),
            shape: getRandomShape(),
            color: getRandomColor(),
            image: getRandomImage(),
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
            particle.style.background = `radial-gradient(circle, ${getRandomChromaticColor()} 30%, transparent 80%)`;
            particle.style.opacity = '1';
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
                    subParticle.style.opacity = '1';
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
            console.log('Score antes:', score);
            setScore(prev => {
                const newScore = Number(prev) + 1 || 0;
                console.log('Score depois:', newScore);
                return newScore;
            });
            setRecords(prev => {
                const key = balloon.image.replace(`${process.env.PUBLIC_URL}`, '');
                console.log('Atualizando record para:', key);
                return {
                    ...prev,
                    [key]: (prev[key] || 0) + 1
                };
            });

            setTimeout(() => {
                setBalloons(prev => prev.filter(b => b.id !== id));
            }, 500);
        }
    }

    return (
        <>
            <div id="score">Balões Estourados: {score}</div>
            <div className="game-container">
                {balloons.map(balloon => (
                    <div
                        key={balloon.id}
                        className={`balloon ${balloon.popped ? 'popped' : ''}`}
                        style={{
                            left: `${balloon.x}px`,
                            top: `${balloon.y}px`,
                            width: `${balloon.size}px`,
                            height: `${balloon.size}px`,
                            border: `5px solid ${balloon.color}`,
                            borderRadius: '50%',
                            clipPath: null
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
                    >
                        <img
                            src={balloon.image}
                            alt="Balloon"
                            className="balloon-image"
                            onError={(e) => {
                                console.error(`Falha ao carregar imagem primária .webp: ${e.target.src}`);
                                const baseName = e.target.src.split('/').pop().replace('.webp', '');
                                const svgPath = `${process.env.PUBLIC_URL}/assets/images/${baseName}.svg`;
                                const pngPath = `${process.env.PUBLIC_URL}/assets/images/${baseName}.png`;
                                e.target.src = svgPath;
                                e.target.onerror = () => {
                                    console.error(`Falha ao carregar imagem .svg: ${svgPath}`);
                                    e.target.src = pngPath;
                                    e.target.onerror = () => {
                                        console.error(`Falha ao carregar imagem .png: ${pngPath}`);
                                        e.target.src = `${process.env.PUBLIC_URL}/assets/images/default.png`;
                                    };
                                };
                            }}
                            onLoad={() => console.log(`Imagem carregada: ${balloon.image}`)}
                        />
                    </div>
                ))}
            </div>
            <div className="record-menu">
                {Object.entries(records).map(([image, count]) => (
                    <div key={image} className="record-item">
                        <img
                            src={`${process.env.PUBLIC_URL}${image}`}
                            alt="Record"
                            className="record-image"
                            onError={(e) => {
                                console.error(`Falha ao carregar recorde .webp: ${e.target.src}`);
                                const baseName = e.target.src.split('/').pop().replace('.webp', '');
                                const svgPath = `${process.env.PUBLIC_URL}/assets/images/${baseName}.svg`;
                                const pngPath = `${process.env.PUBLIC_URL}/assets/images/${baseName}.png`;
                                e.target.src = svgPath;
                                e.target.onerror = () => {
                                    console.error(`Falha ao carregar recorde .svg: ${svgPath}`);
                                    e.target.src = pngPath;
                                    e.target.onerror = () => {
                                        console.error(`Falha ao carregar recorde .png: ${pngPath}`);
                                        e.target.src = `${process.env.PUBLIC_URL}/assets/images/default.png`;
                                    };
                                };
                            }}
                        />
                        <span>{count}</span>
                    </div>
                ))}
            </div>
        </>
    );
}

export default Game;