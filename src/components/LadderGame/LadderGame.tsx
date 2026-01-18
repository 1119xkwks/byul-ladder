"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./LadderGame.module.css";
import { useLadder } from "../../hooks/useLadder";
import { getRandomColor, strokeLine } from "../../utils/ladder-utils";
import { LadderNodeInfo } from "../../types/ladder";

/**
 * 사다리 게임 메인 컴포넌트
 */
export default function LadderGame() {
    const LOG_PREFIX = "[LadderGame] ";
    const {
        memberCount,
        footPrint,
        isWorking,
        canvasRef,
        initGame,
        startDrawing,
        drawPathSync,
        heightNode
    } = useLadder();

    // 입력창에 임시로 입력된 참가자 수를 저장하는 상태
    const [tempCount, setTempCount] = useState<string>("2");
    // 게임에 필요한 최소 참가자 수
    const [minMemberCount] = useState<number>(2);
    // 게임에 허용되는 최대 참가자 수
    const [maxMemberCount] = useState<number>(20);
    // 참가자들의 이름을 저장하는 배열 상태
    const [participants, setParticipants] = useState<string[]>([]);
    // 각 참가자 경로를 그릴 때 사용할 고유 색상 배열 상태
    const [participantColors, setParticipantColors] = useState<string[]>([]);
    // 하단 결과창에 표시될 텍스트 배열 상태
    const [results, setResults] = useState<string[]>([]);
    // 각 도착 인덱스(finalX)에 도달한 참가자 이름을 매핑하여 저장하는 상태
    const [finalResults, setFinalResults] = useState<{ [key: number]: string }>({});
    // 현재 게임의 상태 (랜딩 페이지 혹은 게임 플레이 화면)
    const [gameState, setGameState] = useState<"landing" | "playing">("landing");
    // 모든 참가자의 결과가 나왔는지 여부
    const [isAllFinished, setIsAllFinished] = useState<boolean>(false);
    // 전체 결과 순차 그리기 작업이 진행 중인지 여부 (깜빡임 방지용)
    const [isSequentialDrawing, setIsSequentialDrawing] = useState<boolean>(false);

    // 사다리 한 칸의 가로 너비 (픽셀 단위)
    const EACH_WIDTH = 100;
    // 사다리 한 칸의 세로 높이 (픽셀 단위)
    const EACH_HEIGHT = 25;
    // 현재 배경이 밝은색인지 여부 (흰색/밝은 배경으로 변경 시 true로 설정)
    const isLightMode = false;

    /**
     * 초기 사다리 라인( Poles & Crossbars )을 그립니다.
     */
    const drawInitialLadder = useCallback(() => {
        const FUNC_PREFIX = `${LOG_PREFIX}[drawInitialLadder] `;
        const canvas = canvasRef.current;
        if (!canvas || !footPrint) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Canvas 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        console.log(`${FUNC_PREFIX}drawing initial ladder lines`);

        // 1. 세로 폴(Pole) 그리기
        for (let x = 0; x < memberCount; x++) {
            for (let y = 0; y < heightNode - 1; y++) {
                strokeLine(ctx, x, y, "h", "d", "#ddd", 2, EACH_WIDTH, EACH_HEIGHT, isLightMode);
            }
        }

        // 2. 가로 줄(Crossbar) 그리기
        for (let y = 0; y < heightNode; y++) {
            for (let x = 0; x < memberCount; x++) {
                const nodeKey = `${x}-${y}`;
                const nodeInfo = footPrint[nodeKey] as LadderNodeInfo;
                // draw 속성이 "LEFT_TO_RIGHT"인 노드에서만 오른쪽으로 선을 그림
                if (nodeInfo?.draw === "LEFT_TO_RIGHT") {
                    strokeLine(ctx, x, y, "w", "r", "#ddd", 2, EACH_WIDTH, EACH_HEIGHT, isLightMode);
                }
            }
        }
    }, [canvasRef, footPrint, heightNode, memberCount, isLightMode]);

    /**
     * 게임 시작 버튼 클릭 핸들러
     */
    const handleStart = () => {
        const FUNC_PREFIX = `${LOG_PREFIX}[handleStart] `;
        const count = parseInt(tempCount);
        if (isNaN(count) || count < minMemberCount || count > maxMemberCount) {
            alert(`${minMemberCount}에서 ${maxMemberCount} 사이의 숫자를 입력해주세요.`);
            return;
        }
        console.log(`${FUNC_PREFIX}starting game with ${count} members`);
        setParticipants(Array(count).fill("").map((_, i) => `참가자 ${i + 1}`));
        setParticipantColors(Array(count).fill("").map(() => getRandomColor()));
        setResults(Array(count).fill("").map((_, i) => `결과 ${i + 1}`));
        setFinalResults({});
        setIsAllFinished(false);
        initGame(count);
        setGameState("playing");
    };

    /**
     * 특정 사용자의 사다리 타기를 시작합니다.
     * @param {number} index 시작 위치 (x)
     */
    const handleUserStart = (index: number) => {
        const FUNC_PREFIX = `${LOG_PREFIX}[handleUserStart] `;
        if (isWorking || isSequentialDrawing) return;

        try {
            // 이미 결과가 있는 참여자인 경우, 해당 참여자의 결과만 지우고 다시 그려야 합니다.
            const isRedrawing = Object.values(finalResults).includes(participants[index]);
            if (isRedrawing) {
                // 해당 참가자의 기존 매핑 결과 제거
                const nextFinalResults = { ...finalResults };
                Object.keys(nextFinalResults).forEach(key => {
                    if (nextFinalResults[Number(key)] === participants[index]) {
                        delete nextFinalResults[Number(key)];
                    }
                });
                setFinalResults(nextFinalResults);
                setIsAllFinished(false);

                // 1. 캔버스 리셋 및 기본선 그리기
                drawInitialLadder();

                // 2. 다른 완료된 참가자들의 선은 즉시(Sync) 다시 그려서 유지시킴
                participants.forEach((name, i) => {
                    // 현재 클릭한 인덱스가 아니고, 이미 결과가 도출되어 있는 경우
                    if (i !== index && Object.values(nextFinalResults).includes(name)) {
                        drawPathSync(i, participantColors[i], isLightMode);
                    }
                });
            }

            const color = participantColors[index];
            console.log(`${FUNC_PREFIX}user ${index} started drawing with color ${color}`);

            startDrawing(index, color, (finalX) => {
                console.log(`${FUNC_PREFIX}user ${index} reached result index ${finalX}`);
                setFinalResults(prev => {
                    const nextResults = {
                        ...prev,
                        [finalX]: participants[index]
                    };
                    // 모든 참가자의 결과가 나왔는지 검사
                    if (Object.keys(nextResults).length === participants.length) {
                        setIsAllFinished(true);
                    }
                    return nextResults;
                });
            }, 50, isLightMode);
        } catch (e) {
            console.error(`${FUNC_PREFIX}Error in handleUserStart:`, e);
            if (e instanceof Error) console.error(e.stack);
            alert("참가자 경로를 그리는 중 오류가 발생했습니다.");
        }
    };

    /**
     * 모든 참가자의 결과를 순차적으로 빠르게 확인합니다.
     */
    const handleViewResults = async () => {
        const FUNC_PREFIX = `${LOG_PREFIX}[handleViewResults] `;
        if (isWorking || isSequentialDrawing) return;

        setIsSequentialDrawing(true);

        // 현재 상태를 추적하기 위한 로컬 변수
        let tracker = { ...finalResults };

        try {
            // 이미 모든 결과가 도출된 상태라면 캔버스와 데이터를 초기화
            if (isAllFinished) {
                drawInitialLadder();
                setFinalResults({});
                setIsAllFinished(false);
                tracker = {}; // 로컬 변수도 초기화하여 모든 참가자가 그려지도록 함
                // 리셋 후 시각적인 텀을 줌
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            console.log(`${FUNC_PREFIX}starting sequential result view`);

            for (let i = 0; i < participants.length; i++) {
                // 이미 결과가 있는 참가자는 건너뜀 (tracker 사용)
                const isAlreadyDone = Object.values(tracker).includes(participants[i]);
                if (isAlreadyDone) continue;

                const color = participantColors[i];

                await new Promise<void>((resolve) => {
                    startDrawing(i, color, (finalX) => {
                        setFinalResults(prev => {
                            const updated = {
                                ...prev,
                                [finalX]: participants[i]
                            };
                            if (Object.keys(updated).length === participants.length) {
                                setIsAllFinished(true);
                            }
                            return updated;
                        });
                        resolve();
                    }, 4, isLightMode); // 빠른 속도 (4)
                });

                // 결과 사이의 미세한 간격
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            console.log(`${FUNC_PREFIX}finished sequential result view`);
        } catch (e) {
            console.error(`${FUNC_PREFIX}Error occurred during handleViewResults:`, e);
            if (e instanceof Error) console.error(e.stack);
            alert("결과를 처리하는 도중 오류가 발생했습니다.");
        } finally {
            setIsSequentialDrawing(false);
        }
    };

    useEffect(() => {
        if (gameState === "playing") {
            drawInitialLadder();
        }
    }, [gameState, drawInitialLadder]);

    if (gameState === "landing") {
        return (
            <div className={styles.container}>
                <div className={styles.landing}>
                    <h1 className={styles.title}>별 사다리</h1>
                    <div className={styles.inputGroup}>
                        <label>참가자 수 ({minMemberCount}-{maxMemberCount})</label>
                        <input
                            type="number"
                            value={tempCount}
                            onChange={(e) => setTempCount(e.target.value)}
                            min={minMemberCount}
                            max={maxMemberCount}
                        />
                        <button className={styles.startButton} onClick={handleStart}>
                            START
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isAnyWorking = isWorking || isSequentialDrawing;

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
                        height: (heightNode - 1) * EACH_HEIGHT + 6,
                        minWidth: (memberCount - 1) * EACH_WIDTH + 6
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
                                style={{
                                    backgroundColor: participantColors[i],
                                    opacity: isAnyWorking ? 0.6 : 1,
                                    cursor: isAnyWorking ? "not-allowed" : "pointer"
                                }}
                                onClick={() => handleUserStart(i)}
                                disabled={isAnyWorking}
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

            <button
                className={styles.viewResultsButton}
                onClick={handleViewResults}
                disabled={isAnyWorking}
            >
                {isAnyWorking ? "결과 그리는 중..." : (isAllFinished ? "결과 애니메이션 다시보기" : "결과 바로보기")}
            </button>
        </div>
    );
}
