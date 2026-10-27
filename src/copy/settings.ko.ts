// 설정 화면 문구

export const SETTINGS_TITLE = '설정';
export const SETTINGS_BROADCAST = '알림 시간만 정해 주슈. 방송은 이장이 알아서 혀유.';

export const ALARM_SECTION = '아침 소식 알림';
export const ALARM_DESC = '밤사이 마을 소식이 오면 하루에 한 번 알려 드립니다.';
export const ALARM_WEB = '웹에서는 알림을 보낼 수 없습니다. 아이폰 앱에서 켜 주세요.';
export const ALARM_DENIED = '알림 권한이 꺼져 있습니다. 아이폰 설정 › 알림에서 켜 주세요.';

export const BACKUP_SECTION = '백업';
export const BACKUP_DESC = '마을 기록은 이 기기에만 있습니다. 가끔 파일로 내보내 두세요.';
export const BACKUP_EXPORT = '백업 파일 내보내기';
export const BACKUP_IMPORT = '백업 파일 가져오기';
export const BACKUP_IMPORT_CONFIRM = '지금 마을을 백업 파일 내용으로 바꿉니다. 지금 기록은 사라집니다.';
export const BACKUP_IMPORT_GO = '네, 바꾸기';
export const BACKUP_DONE_EXPORT = '내보냈습니다.';
export const BACKUP_DONE_IMPORT = '가져왔습니다. 마을이 그대로 돌아왔습니다.';

export const BACKUP_ERROR = {
  notJson: '백업 파일이 아닙니다.',
  notOurs: '솔빛 마을 백업 파일이 아닙니다.',
  tooNew: '더 새 버전 앱에서 만든 백업입니다. 앱을 업데이트한 뒤 가져와 주세요.',
  broken: '파일이 망가져서 읽을 수 없습니다.',
  failed: '처리하지 못했습니다. 다시 시도해 주세요.',
} as const;

export const DEV_WAKE_TITLE = '개발자 · 솔이 깨우기';
export const DEV_WAKE_SUB = '아침 첫 화면 확인용';
export const WAKE_BUTTON = '솔이 깨우기';
