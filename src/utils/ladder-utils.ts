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
 * 리스트에서 지정된 개수만큼 랜덤하게 항목을 선택합니다.
 * @param {T[]} array 원본 리스트
 * @param {number} count 선택할 개수
 * @returns {T[]} 선택된 항목 리스트
 */
export const pickRandomItems = <T>(array: T[], count: number): T[] => {
    const LOG_PREFIX = "[pickRandomItems] ";
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    console.log(`${LOG_PREFIX}picked ${selected.length} items from ${array.length}`);
    return selected;
};

/**
 * 사다리의 기본 노드 데이터를 랜덤하게 생성합니다.
 * 
 * [생성 규칙]
 * 1. 가로축(Column) 중심으로 반복하며 각 폴 사이의 가로줄을 생성합니다.
 * 2. 세로줄의 최상단과 최하단에는 가로줄이 생성되지 않습니다 (여백 확보).
 * 3. 인접한 이전 가로줄과 수평으로 겹치지 않도록 검사하여 지그재그 패턴을 유도합니다.
 * 4. 각 컬럼당 유효 슬롯의 25% ~ 60% 범위 내에서 랜덤하게 가로줄을 생성합니다.
 * 5. 최소 25%의 결과가 0일 경우에도 최소 1개의 가로줄은 반드시 생성합니다.
 * 
 * @param {number} widthNode 참여자 수 (폴의 개수)
 * @param {number} heightNode 세로 노드 수 (전체 높이)
 * @returns {FootPrint} 생성된 노드 데이터 (x-y 좌표 기반)
 */
export const generateRandomNodeData = (widthNode: number, heightNode: number): FootPrint => {
    const LOG_PREFIX = "[generateRandomNodeData] ";
    const footPrint: FootPrint = {};

    // 초기화: 모든 노드를 기본값으로 설정
    for (let y = 0; y < heightNode; y++) {
        for (let x = 0; x < widthNode; x++) {
            footPrint[`${x}-${y}`] = { change: false, draw: "NONE" };
        }
    }

    // 가로줄(pole 사이의 gap) 단위로 반복
    for (let x = 0; x < widthNode - 1; x++) {
        const FUNC_PREFIX = `${LOG_PREFIX}[Column ${x}] `;

        // 유효한 y 인덱스 후보군 추출 (세로줄 시작/끝 제외: 2 ~ heightNode-3)
        const availableYSlots: number[] = [];
        for (let y = 2; y <= heightNode - 3; y++) {
            // 규칙: 이전 가로 라인(x-1)과 동일한 수평 위치(y)이면 그리지 않기 위해 제외
            // 이전 칸의 draw가 "LEFT_TO_RIGHT"이면 현재 칸에서는 그릴 수 없음 (지그재그 유도)
            const prevNode = footPrint[`${x - 1}-${y}`] as LadderNodeInfo;
            const isPrevAligned = x > 0 && prevNode?.draw === "LEFT_TO_RIGHT";

            if (!isPrevAligned) {
                availableYSlots.push(y);
            }
        }

        const totalAvailable = availableYSlots.length;
        // 가로줄 개수 제한: 최소 25% (최소 1개), 최대 60%
        const minLines = Math.max(1, Math.floor(totalAvailable * 0.25));
        const maxLines = Math.max(minLines, Math.floor(totalAvailable * 0.6));

        // 가로 라인 위치 제외 갯수(totalAvailable) 기준으로 랜덤 갯수 결정
        const targetCount = Math.floor(Math.random() * (maxLines - minLines + 1)) + minLines;

        console.log(`${FUNC_PREFIX}available slots: ${totalAvailable}, target count: ${targetCount}`);

        // 후보군에서 랜덤하게 선택
        const selectedYSlots = pickRandomItems(availableYSlots, targetCount);

        selectedYSlots.forEach(y => {
            // 현재 노드: 오른쪽으로 가는 줄의 시작점
            footPrint[`${x}-${y}`] = { change: true, draw: "LEFT_TO_RIGHT" };
            // 우측 노드: 왼쪽에서 온 줄의 도착점
            footPrint[`${x + 1}-${y}`] = { change: true, draw: "RIGHT_TO_LEFT" };
        });
    }

    console.log(`${LOG_PREFIX}generation completed for ${widthNode} poles`);
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
 * @param {boolean} isLightMode 배경이 밝은색인지 여부 (기본값: false)
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
    eachHeight: number = 25,
    isLightMode: boolean = false
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

    // 기본 사다리 선(#ddd)이 아닌 경우(참가자 경로인 경우) 테두리를 먼저 그려줌
    if (color !== "#ddd") {
        ctx.beginPath();
        ctx.moveTo(moveToStart + 3, moveToEnd + 2);
        ctx.lineTo(lineToStart + 3, lineToEnd + 2);
        // 배경색에 상반되는 테두리 색상 선택 (어두운 배경 -> 흰색 테두리, 밝은 배경 -> 어두운 테두리)
        ctx.strokeStyle = isLightMode ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = width + 2; // 실제 선보다 약간 두껍게
        ctx.lineCap = "butt"; // 마디(Joint) 뭉침 방지
        ctx.stroke();
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.moveTo(moveToStart + 3, moveToEnd + 2);
    ctx.lineTo(lineToStart + 3, lineToEnd + 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "butt"; // 내부 선도 마디 없이 연결
    ctx.stroke();
    ctx.closePath();
    console.log(`${LOG_PREFIX}drew line: ${x}-${y} ${flag} ${dir} ${color}`);
};
