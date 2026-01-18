import { useState, useCallback, useRef } from "react";
import { FootPrint, CheckFootPrint, LadderNodeInfo } from "../types/ladder";
import { generateRandomNodeData, strokeLine } from "../utils/ladder-utils";

/**
 * 사다리 게임의 핵심 로직을 관리하는 커스텀 훅입니다.
 * @returns 사다리 게임 상태 및 제어 함수들
 */
export const useLadder = () => {
    const LOG_PREFIX = "[useLadder] ";
    // 현재 게임에 참여 중인 인원 수
    const [memberCount, setMemberCount] = useState<number>(0);
    // 생성된 사다리의 가로줄 연결 데이터 ("x-y": 정보)
    const [footPrint, setFootPrint] = useState<FootPrint>({});
    // 사다리 타기 애니메이션이 진행 중인지 여부
    const [isWorking, setIsWorking] = useState<boolean>(false);
    // 사다리의 전체 세로 노드(층) 개수
    const [heightNode] = useState<number>(12);

    // 캔버스 엘리먼트를 제어하기 위한 ref
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // 특정 노드 방문 여부를 기록하여 애니메이션 처리에 사용하는 ref
    const checkFootPrintRef = useRef<CheckFootPrint>({});

    /**
     * 게임을 초기화하고 노드 데이터를 생성합니다.
     * @param {number} count 참여자 수
     */
    const initGame = useCallback((count: number) => {
        const FUNC_PREFIX = `${LOG_PREFIX}[initGame] `;
        console.log(`${FUNC_PREFIX}initialing game with ${count} members`);
        setMemberCount(count);
        const data = generateRandomNodeData(count, heightNode);
        setFootPrint(data);
        setIsWorking(false);
        checkFootPrintRef.current = {};
    }, [heightNode]);

    /**
     * 방문 기록을 초기화합니다.
     */
    const resetCheckFootPrint = useCallback(() => {
        const FUNC_PREFIX = `${LOG_PREFIX}[resetCheckFootPrint] `;
        const newCheckFootPrint: CheckFootPrint = {};
        for (let r = 0; r < heightNode; r++) {
            for (let c = 0; c < memberCount; c++) {
                newCheckFootPrint[`${c}-${r}`] = false;
            }
        }
        checkFootPrintRef.current = newCheckFootPrint;
        console.log(`${FUNC_PREFIX}reset visit history`);
    }, [heightNode, memberCount]);

    /**
     * 사다리 타기 애니메이션을 시작합니다.
     * 
     * [애니메이션 및 경로 탐색 로직]
     * 1. 현재 위치(x, y)에서 `footPrint` 데이터를 조회하여 가로줄 연결 여부를 확인합니다.
     * 2. 오른쪽 연결(`draw: "LEFT_TO_RIGHT"`): 오른쪽으로 한 칸 이동 후 즉시 아래로 하강합니다.
     * 3. 왼쪽 연결(`draw: "RIGHT_TO_LEFT"`): 왼쪽으로 한 칸 이동 후 즉시 아래로 하강합니다.
     * 4. 연결 없음(`draw: "NONE"`): 현재 위치에서 아래로 하강합니다.
     * 5. 최하단(y === heightNode - 1) 도달 시 애니메이션을 종료하고 결과 인덱스를 반환합니다.
     * 
     * @param {number} startX 시작 폴(pole)의 인덱스 (0 ~ memberCount - 1)
     * @param {string} color 경로를 그릴 브러쉬 색상
     * @param {(finalX: number) => void} onFinish 도착 지점에 도달했을 때 실행될 콜백 함수
     * @param {number} speed 애니메이션 속도 (기본값: 50)
     * @param {boolean} isLightMode 배경이 밝은색인지 여부
     */
    const startDrawing = useCallback((
        startX: number,
        color: string,
        onFinish: (finalX: number) => void,
        speed: number = 50,
        isLightMode: boolean = false
    ) => {
        const FUNC_PREFIX = `${LOG_PREFIX}[startDrawing] `;
        if (isWorking) return;

        try {
            setIsWorking(true);
            resetCheckFootPrint();

            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) {
                console.error(`${FUNC_PREFIX}canvas context not found`);
                setIsWorking(false);
                return;
            }

            const moveNext = (x: number, y: number) => {
                try {
                    const FUNC_PREFIX = `${LOG_PREFIX}[moveNext] `;
                    const currentNodeKey = `${x}-${y}`;
                    const ANIMATION_SPEED = speed;

                    // 끝에 도달했는지 확인
                    if (y === heightNode - 1) {
                        console.log(`${FUNC_PREFIX}reached end at pole: ${x}`);
                        setIsWorking(false);
                        onFinish(x);
                        return;
                    }

                    // 현재 노드의 가로줄 연결 상태 데이터 가져오기 (change: 연결 여부, draw: 이동 방향)
                    const nodeInfo = footPrint[currentNodeKey] as LadderNodeInfo;

                    switch (nodeInfo?.draw) {
                        case "LEFT_TO_RIGHT":
                            // [오른쪽 이동] 현재 노드가 가로줄의 시작점인 경우
                            console.log(`${FUNC_PREFIX}moving RIGHT from ${x}-${y} (speed: ${ANIMATION_SPEED})`);
                            strokeLine(ctx, x, y, "w", "r", color, 3, 100, 25, isLightMode);
                            setTimeout(() => {
                                try {
                                    const nextX = x + 1;
                                    // 가로 이동 후 해당 폴(오른쪽)에서 즉시 아래로 하강 선을 그림
                                    strokeLine(ctx, nextX, y, "h", "d", color, 3, 100, 25, isLightMode);
                                    // 다음 호출에서는 y를 증가시켜 아래 층으로 이동
                                    setTimeout(() => moveNext(nextX, y + 1), ANIMATION_SPEED);
                                } catch (e) {
                                    throw e; // 상위 catch에서 처리
                                }
                            }, ANIMATION_SPEED);
                            break;

                        case "RIGHT_TO_LEFT":
                            // [왼쪽 이동] 현재 노드가 가로줄의 끝점인 경우
                            console.log(`${FUNC_PREFIX}moving LEFT from ${x}-${y} (speed: ${ANIMATION_SPEED})`);
                            strokeLine(ctx, x, y, "w", "l", color, 3, 100, 25, isLightMode);
                            setTimeout(() => {
                                try {
                                    const nextX = x - 1;
                                    // 가로 이동 후 해당 폴(왼쪽)에서 즉시 아래로 하강 선을 그림
                                    strokeLine(ctx, nextX, y, "h", "d", color, 3, 100, 25, isLightMode);
                                    // 다음 호출에서는 y를 증가시켜 아래 층으로 이동
                                    setTimeout(() => moveNext(nextX, y + 1), ANIMATION_SPEED);
                                } catch (e) {
                                    throw e;
                                }
                            }, ANIMATION_SPEED);
                            break;

                        case "NONE":
                        default:
                            // [아래로 이동] 연결된 가로줄이 전혀 없는 노드인 경우 (draw: "NONE")
                            console.log(`${FUNC_PREFIX}moving DOWN from ${x}-${y} (speed: ${ANIMATION_SPEED})`);
                            strokeLine(ctx, x, y, "h", "d", color, 3, 100, 25, isLightMode);
                            // 수평 이동 없이 바로 다음 층(y+1)으로 이동
                            setTimeout(() => moveNext(x, y + 1), ANIMATION_SPEED);
                            break;
                    }   // end switch
                } catch (e) {
                    console.error(`${LOG_PREFIX}Error in moveNext:`, e);
                    if (e instanceof Error) console.error(e.stack);
                    alert("사다리 타기 수행 중 오류가 발생했습니다.");
                    setIsWorking(false);
                }
            };

            moveNext(startX, 0);
        } catch (e) {
            console.error(`${FUNC_PREFIX}Error in startDrawing:`, e);
            if (e instanceof Error) console.error(e.stack);
            alert("그리기 시작 중 오류가 발생했습니다.");
            setIsWorking(false);
        }
    }, [isWorking, footPrint, heightNode, resetCheckFootPrint, LOG_PREFIX]);

    /**
     * 사다리 경로를 애니메이션 없이 즉시 그립니다.
     * @param {number} startX 시작 폴 인덱스
     * @param {string} color 선 색상
     * @param {boolean} isLightMode 배경이 밝은색인지 여부
     */
    const drawPathSync = useCallback((startX: number, color: string, isLightMode: boolean = false) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        let x = startX;
        for (let y = 0; y < heightNode - 1; y++) {
            const currentNodeKey = `${x}-${y}`;
            const nodeInfo = footPrint[currentNodeKey] as LadderNodeInfo;

            switch (nodeInfo?.draw) {
                case "LEFT_TO_RIGHT":
                    strokeLine(ctx, x, y, "w", "r", color, 3, 100, 25, isLightMode);
                    x = x + 1;
                    strokeLine(ctx, x, y, "h", "d", color, 3, 100, 25, isLightMode);
                    break;
                case "RIGHT_TO_LEFT":
                    strokeLine(ctx, x, y, "w", "l", color, 3, 100, 25, isLightMode);
                    x = x - 1;
                    strokeLine(ctx, x, y, "h", "d", color, 3, 100, 25, isLightMode);
                    break;
                case "NONE":
                default:
                    strokeLine(ctx, x, y, "h", "d", color, 3, 100, 25, isLightMode);
                    break;
            }
        }
    }, [footPrint, heightNode]);

    return {
        memberCount,
        setMemberCount,
        footPrint,
        isWorking,
        canvasRef,
        initGame,
        startDrawing,
        drawPathSync,
        heightNode
    };
};
