"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLadder } from "../../hooks/useLadder";
import { getRandomColor, strokeLine } from "../../utils/ladder-utils";
import styles from "./LadderGame.module.css";
import { LadderNodeInfo } from "../../types/ladder";

/**
 * 사다리 게임의 메인 컴포넌트입니다.
 */
export default function LadderGame() {
    const LOG_PREFIX = "[LadderGame] ";
    const {
        memberCount,
        setMemberCount,
        footPrint,
        isWorking,
        canvasRef,
        initGame,
        startDrawing,
        heightNode
    } = useLadder();

    const [tempCount, setTempCount] = useState<string>("2");
    const [participants, setParticipants] = useState<string[]>([]);
    const [participantColors, setParticipantColors] = useState<string[]>([]);
    const [results, setResults] = useState<string[]>([]);
    const [finalResults, setFinalResults] = useState<{ [key: number]: string }>({});
    const [gameState, setGameState] = useState<"landing" | "playing">("landing");

    const EACH_WIDTH = 100;
    const EACH_HEIGHT = 25;

    /**
     * 게임 시작 버튼 클릭 핸들러
     */
    const handleStart = () => {
        const FUNC_PREFIX = `${LOG_PREFIX}[handleStart] `;
        const count = parseInt(tempCount);
        if (isNaN(count) || count < 2 || count > 10) {
            alert("2에서 10 사이의 숫자를 입력해주세요.");
            return;
        }
        console.log(`${FUNC_PREFIX}starting game with ${count} members`);
        setParticipants(Array(count).fill("").map((_, i) => `참가자 ${i + 1}`));
        setParticipantColors(Array(count).fill("").map(() => getRandomColor()));
        setResults(Array(count).fill("").map((_, i) => `결과 ${i + 1}`));
        setFinalResults({});
        initGame(count);
        setGameState("playing");
    };

    /**
     * 초기 사다리 라인을 그립니다.
     */
    const drawInitialLadder = useCallback(() => {
        const FUNC_PREFIX = `${LOG_PREFIX}[drawInitialLadder] `;
        const canvas = canvasRef.current;
        if (!canvas || !footPrint) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        console.log(`${FUNC_PREFIX}drawing initial ladder lines`);

        // 1. Draw vertical lines (the poles)
        for (let x = 0; x < memberCount; x++) {
            for (let y = 0; y < heightNode - 1; y++) {
                strokeLine(ctx, x, y, "h", "d", "#ddd", 2, EACH_WIDTH, EACH_HEIGHT);
            }
        }

        // 2. Draw horizontal lines based on footPrint
        for (let y = 0; y < heightNode; y++) {
            for (let x = 0; x < memberCount; x++) {
                const nodeKey = `${x}-${y}`;
                const nodeInfo = footPrint[nodeKey] as LadderNodeInfo;
                if (nodeInfo?.change && nodeInfo?.draw) {
                    strokeLine(ctx, x, y, "w", "r", "#ddd", 2, EACH_WIDTH, EACH_HEIGHT);
                }
            }
        }
    }, [canvasRef, footPrint, heightNode, memberCount]);

    useEffect(() => {
        if (gameState === "playing") {
            drawInitialLadder();
        }
    }, [gameState, drawInitialLadder]);

    /**
     * 특정 사용자의 사다리 타기를 시작합니다.
     * @param {number} index 시작 위치 (x)
     */
    const handleUserStart = (index: number) => {
        const FUNC_PREFIX = `${LOG_PREFIX}[handleUserStart] `;
        if (isWorking) return;

        const color = participantColors[index];
        console.log(`${FUNC_PREFIX}user ${index} started drawing with color ${color}`);

        startDrawing(index, color, (finalX) => {
            console.log(`${FUNC_PREFIX}user ${index} reached result index ${finalX}`);
            setFinalResults(prev => ({
                ...prev,
                [finalX]: participants[index]
            }));
        });
    };

    if (gameState === "landing") {
        return (
            <div className={styles.container}>
                <div className={styles.landing}>
                    <h1 className={styles.title}>별 사다리</h1>
                    <div className={styles.inputGroup}>
                        <label>참가자 수 (2-10)</label>
                        <input
                            type="number"
                            value={tempCount}
                            onChange={(e) => setTempCount(e.target.value)}
                            min="2"
                            max="10"
                        />
                        <button className={styles.startButton} onClick={handleStart}>
                            START
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => setGameState("landing")}>
                Back
            </button>

            <div className={styles.gameArea}>
                <div
                    className={styles.ladderWrapper}
                    style={{
                        width: (memberCount - 1) * EACH_WIDTH + 6,
                        height: (heightNode - 1) * EACH_HEIGHT + 6
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className={styles.canvas}
                        width={(memberCount - 1) * EACH_WIDTH + 6}
                        height={(heightNode - 1) * EACH_HEIGHT + 6}
                    />

                    {/* Participants */}
                    {participants.map((name, i) => (
                        <div
                            key={`p-${i}`}
                            className={styles.participantWrapper}
                            style={{ left: i * EACH_WIDTH - 40 + 3 }}
                        >
                            <input
                                className={styles.nameInput}
                                value={name}
                                onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[i] = e.target.value;
                                    setParticipants(newParticipants);
                                }}
                            />
                            <button
                                className={styles.startPointButton}
                                style={{ backgroundColor: participantColors[i] }}
                                onClick={() => handleUserStart(i)}
                                disabled={isWorking}
                            />
                        </div>
                    ))}

                    {/* Results */}
                    {results.map((res, i) => (
                        <div
                            key={`r-${i}`}
                            className={styles.resultWrapper}
                            style={{ left: i * EACH_WIDTH - 40 + 3 }}
                        >
                            <input
                                className={styles.nameInput}
                                value={res}
                                onChange={(e) => {
                                    const newResults = [...results];
                                    newResults[i] = e.target.value;
                                    setResults(newResults);
                                }}
                            />
                            <p className={styles.resultText}>{finalResults[i] || ""}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
