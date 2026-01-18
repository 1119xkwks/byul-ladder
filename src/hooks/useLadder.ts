import { useState, useCallback, useRef } from "react";
import { FootPrint, CheckFootPrint, LadderNodeInfo } from "../types/ladder";
import { generateRandomNodeData, strokeLine } from "../utils/ladder-utils";

/**
 * 사다리 게임의 핵심 로직을 관리하는 커스텀 훅입니다.
 * @returns 사다리 게임 상태 및 제어 함수들
 */
export const useLadder = () => {
    const LOG_PREFIX = "[useLadder] ";
    const [memberCount, setMemberCount] = useState<number>(0);
    const [footPrint, setFootPrint] = useState<FootPrint>({});
    const [isWorking, setIsWorking] = useState<boolean>(false);
    const [heightNode] = useState<number>(10);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
     * @param {number} startNode 시작 노드 인덱스 (x)
     * @param {string} color 선 색상
     * @param {Function} onFinish 완료 시 콜백
     */
    const startDrawing = useCallback((startX: number, color: string, onFinish: (finalX: number) => void) => {
        const FUNC_PREFIX = `${LOG_PREFIX}[startDrawing] `;
        if (isWorking) return;

        setIsWorking(true);
        resetCheckFootPrint();

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        const moveNext = (x: number, y: number) => {
            const currentNodeKey = `${x}-${y}`;
            checkFootPrintRef.current[currentNodeKey] = true;

            // 끝에 도달했는지 확인
            if (y === heightNode - 1) {
                console.log(`${FUNC_PREFIX}reached end at x: ${x}`);
                setIsWorking(false);
                onFinish(x);
                return;
            }

            const nodeInfo = footPrint[currentNodeKey] as LadderNodeInfo;
            const leftNodeKey = `${x - 1}-${y}`;
            const rightNodeKey = `${x + 1}-${y}`;
            const downNodeKey = `${x}-${y + 1}`;

            if (nodeInfo?.change) {
                const leftNodeInfo = footPrint[leftNodeKey] as LadderNodeInfo;
                const rightNodeInfo = footPrint[rightNodeKey] as LadderNodeInfo;

                // 좌우 이동 로직
                if (footPrint.hasOwnProperty(leftNodeKey) && footPrint.hasOwnProperty(rightNodeKey)) {
                    if (leftNodeInfo?.change && leftNodeInfo?.draw && !checkFootPrintRef.current[leftNodeKey]) {
                        strokeLine(ctx, x, y, "w", "l", color, 3);
                        setTimeout(() => moveNext(x - 1, y), 100);
                    } else if (rightNodeInfo?.change && !checkFootPrintRef.current[rightNodeKey]) {
                        strokeLine(ctx, x, y, "w", "r", color, 3);
                        setTimeout(() => moveNext(x + 1, y), 100);
                    } else {
                        strokeLine(ctx, x, y, "h", "d", color, 3);
                        setTimeout(() => moveNext(x, y + 1), 100);
                    }
                } else if (!footPrint.hasOwnProperty(leftNodeKey)) { // 가장 왼쪽
                    if (rightNodeInfo?.change && !checkFootPrintRef.current[rightNodeKey]) {
                        strokeLine(ctx, x, y, "w", "r", color, 3);
                        setTimeout(() => moveNext(x + 1, y), 100);
                    } else {
                        strokeLine(ctx, x, y, "h", "d", color, 3);
                        setTimeout(() => moveNext(x, y + 1), 100);
                    }
                } else if (!footPrint.hasOwnProperty(rightNodeKey)) { // 가장 오른쪽
                    if (leftNodeInfo?.change && leftNodeInfo?.draw && !checkFootPrintRef.current[leftNodeKey]) {
                        strokeLine(ctx, x, y, "w", "l", color, 3);
                        setTimeout(() => moveNext(x - 1, y), 100);
                    } else {
                        strokeLine(ctx, x, y, "h", "d", color, 3);
                        setTimeout(() => moveNext(x, y + 1), 100);
                    }
                }
            } else {
                strokeLine(ctx, x, y, "h", "d", color, 3);
                setTimeout(() => moveNext(x, y + 1), 100);
            }
        };

        moveNext(startX, 0);
    }, [isWorking, footPrint, heightNode, resetCheckFootPrint]);

    return {
        memberCount,
        setMemberCount,
        footPrint,
        isWorking,
        canvasRef,
        initGame,
        startDrawing,
        heightNode
    };
};
