/**
 * 사다리의 이동 방향을 정의하는 타입
 * LEFT_TO_RIGHT: 현재 위치에서 오른쪽으로 이동하는 가로줄의 시작점
 * RIGHT_TO_LEFT: 현재 위치에서 왼쪽으로 이동하는 가로줄의 도착점
 * NONE: 연결된 가로줄 없음
 */
export type LadderDirection = "LEFT_TO_RIGHT" | "RIGHT_TO_LEFT" | "NONE";

/**
 * 사다리 노드 정보를 담는 인터페이스
 */
export interface LadderNodeInfo {
    // 해당 위치에 가로줄로 인한 경로 변화가 있는지 여부
    change: boolean;
    // 가로줄의 방향성 (기존 boolean draw를 명시적인 방향 타입으로 대체)
    draw: LadderDirection;
}

/**
 * 모든 사다리 노드의 상태를 관리하는 객체 타입
 * 키 형식: "x-y" (ex: "0-0", "1-5")
 */
export interface FootPrint {
    // x-y 좌표를 키로 하여 해당 위치의 노드 정보 혹은 초기화용 불리언 값을 가짐
    [key: string]: LadderNodeInfo | boolean;
}

/**
 * 방문 여부를 확인하기 위한 객체 타입 (애니메이션 경로 중복 방지)
 */
export interface CheckFootPrint {
    // x-y 좌표를 키로 하여 해당 노드 방문 여부를 저장
    [key: string]: boolean;
}

/**
 * 게임 설정 및 언어팩 (다국어 지원 대비)
 */
export interface WordPack {
    // 게임 제목
    title: string;
    // 참가자 설정 레이블
    join: string;
    // 최소 인원 미달 시 메시지
    min_msg: string;
    // 최대 인원 초과 시 메시지
    max_msg: string;
    // 숫자 미입력 시 메시지
    noNumber_msg: string;
}
