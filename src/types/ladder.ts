/**
 * 사다리 노드 정보를 담는 인터페이스
 */
export interface LadderNodeInfo {
    change: boolean;
    draw: boolean;
}

/**
 * 모든 사다리 노드의 상태를 관리하는 객체 타입
 * 키 형식: "x-y" (ex: "0-0", "1-5")
 */
export interface FootPrint {
    [key: string]: LadderNodeInfo | boolean;
}

/**
 * 방문 여부를 확인하기 위한 객체 타입
 */
export interface CheckFootPrint {
    [key: string]: boolean;
}

/**
 * 게임 설정 및 언어팩
 */
export interface WordPack {
    title: string;
    join: string;
    min_msg: string;
    max_msg: string;
    noNumber_msg: string;
}
