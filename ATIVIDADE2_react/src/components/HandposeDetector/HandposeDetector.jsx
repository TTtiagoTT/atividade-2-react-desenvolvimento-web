// src/components/HandposeDetector/HandposeDetector.jsx
import React, { useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@mediapipe/hands';

tf.setBackend('webgl').then(() => console.log("TFJS Backend set to WebGL"));

function HandposeDetector({ onHandMove }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    useEffect(() => {
        async function setupHandpose() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await new Promise((resolve) => {
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current.play();
                            if (canvasRef.current && videoRef.current) {
                                canvasRef.current.width = videoRef.current.videoWidth;
                                canvasRef.current.height = videoRef.current.videoHeight;
                            }
                            resolve();
                        };
                    });
                }

                const model = handPoseDetection.SupportedModels.MediaPipeHands;
                const detectorConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
                    modelType: 'full'
                };
                detectorRef.current = await handPoseDetection.createDetector(model, detectorConfig);
                console.log("Handpose detector created.");
                detectHandsLoop();
            } catch (error) {
                console.error("Erro ao configurar Handpose ou câmera:", error);
                if (onHandMove) {
                    onHandMove(null, false, true); // position, handDetected, errorOccurred
                }
            }
        }

        async function detectHandsLoop() {
            if (detectorRef.current && videoRef.current && videoRef.current.readyState === 4) {
                const video = videoRef.current;
                const hands = await detectorRef.current.estimateHands(video, { flipHorizontal: true });
                const ctx = canvasRef.current ? canvasRef.current.getContext('2d') : null;

                if (ctx && canvasRef.current) {
                    if (canvasRef.current.width !== video.videoWidth || canvasRef.current.height !== video.videoHeight) {
                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;
                    }
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.translate(-canvasRef.current.width, 0);
                }

                if (hands.length > 0) {
                    const hand = hands[0];
                    if (ctx) {
                        hand.keypoints.forEach(keypoint => {
                            ctx.beginPath();
                            ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
                            ctx.fillStyle = 'red';
                            ctx.fill();
                        });
                        const indicatorFingerTip = hand.keypoints[8];
                        ctx.beginPath();
                        ctx.arc(indicatorFingerTip.x, indicatorFingerTip.y, 10, 0, 2 * Math.PI);
                        ctx.fillStyle = 'blue';
                        ctx.fill();
                    }

                    const indicator = hand.keypoints[8];
                    let normalizedX = indicator.x / video.videoWidth;
                    const screenX = normalizedX * window.innerWidth;
                    const normalizedY = indicator.y / video.videoHeight;
                    const screenY = normalizedY * window.innerHeight;

                    if (onHandMove) {
                        onHandMove({ x: screenX, y: screenY }, true, false);
                    }
                } else {
                    if (onHandMove) {
                        onHandMove(null, false, false);
                    }
                }
                
                if (ctx) {
                    ctx.restore();
                }
            }
            animationFrameIdRef.current = requestAnimationFrame(detectHandsLoop);
        }

        setupHandpose();

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (detectorRef.current) {
                detectorRef.current.dispose();
                detectorRef.current = null;
            }
            console.log("Handpose detector cleaned up.");
        };
    }, [onHandMove]);

    return (
        <>
            <video
                ref={videoRef} 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    zIndex: 0 // ALTERADO: Vídeo na camada base visível
                }}
                playsInline
                autoPlay
                muted
            />
            <canvas
                ref={canvasRef} 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 1, // ALTERADO: Canvas acima do vídeo
                    pointerEvents: 'none'
                }}
            />
        </>
    );
}

export default HandposeDetector;
