import { FootPrint, LadderNodeInfo } from "../types/ladder";

/**
 * 랜덤한 색상을 생성합니다.
 * @returns {string} HEX 색상 코드
 */
export const getRandomColor = (): string => {
    const LOG_PREFIX = "[getRandomColor] ";
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    console.log(`${LOG_PREFIX}generated color: ${color}`);
    return color;
};

/**
 * 사다리의 기본 노드 데이터를 랜덤하게 생성합니다.
 * @param {number} widthNode 참여자 수
 * @param {number} heightNode 세로 노드 수
 * @returns {FootPrint} 생성된 노드 데이터
 */
export const generateRandomNodeData = (widthNode: number, heightNode: number): FootPrint => {
    const LOG_PREFIX = "[generateRandomNodeData] ";
    const footPrint: FootPrint = {};

    for (let y = 0; y < heightNode; y++) {
        for (let x = 0; x < widthNode; x++) {
            const loopNode = `${x}-${y}`;
            const rand = Math.floor(Math.random() * 2);

            if (rand === 0) {
                footPrint[loopNode] = { change: false, draw: false };
            } else {
                if (x === widthNode - 1) {
                    footPrint[loopNode] = { change: false, draw: false };
                } else {
                    footPrint[loopNode] = { change: true, draw: true };
                    // 가로줄이 연결되므로 다음 x 노드는 draw가 false여야 함 (왼쪽에서 오는 줄)
                    const nextNode = `${x + 1}-${y}`;
                    footPrint[nextNode] = { change: true, draw: false };
                    x = x + 1;
                }
            }
        }
    }
    console.log(`${LOG_PREFIX}generated node data for ${widthNode}x${heightNode}`);
    return footPrint;
};

/**
 * 캔버스에 선을 그립니다.
 * @param {CanvasRenderingContext2D} ctx 캔버스 컨텍스트
 * @param {number} x 시작 x 좌표
 * @param {number} y 시작 y 좌표
 * @param {"w" | "h"} flag 가로(w) 또는 세로(h)
 * @param {"r" | "l" | "d"} dir 방향 (오른쪽, 왼쪽, 아래)
 * @param {string} color 선 색상
 * @param {number} width 선 두께
 * @param {number} eachWidth 칸 너비
 * @param {number} eachHeight 칸 높이
 */
export const strokeLine = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    flag: "w" | "h",
    dir: "r" | "l" | "d",
    color: string,
    width: number,
    eachWidth: number = 100,
    eachHeight: number = 25
): void => {
    const LOG_PREFIX = "[strokeLine] ";
    let moveToStart = 0;
    let moveToEnd = 0;
    let lineToStart = 0;
    let lineToEnd = 0;

    if (flag === "w") {
        if (dir === "r") {
            moveToStart = x * eachWidth;
            moveToEnd = y * eachHeight;
            lineToStart = (x + 1) * eachWidth;
            lineToEnd = y * eachHeight;
        } else {
            moveToStart = x * eachWidth;
            moveToEnd = y * eachHeight;
            lineToStart = (x - 1) * eachWidth;
            lineToEnd = y * eachHeight;
        }
    } else {
        moveToStart = x * eachWidth;
        moveToEnd = y * eachHeight;
        lineToStart = x * eachWidth;
        lineToEnd = (y + 1) * eachHeight;
    }

    ctx.beginPath();
    ctx.moveTo(moveToStart + 3, moveToEnd + 2);
    ctx.lineTo(lineToStart + 3, lineToEnd + 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
    console.log(`${LOG_PREFIX}drew line: ${x}-${y} ${flag} ${dir} ${color}`);
};
