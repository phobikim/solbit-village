// 백업 파일 주고받기. 네이티브: 캐시에 파일을 만들어 공유 시트로 내보내고, 문서 선택기로 가져온다.
// 웹(개발 확인용): 브라우저 다운로드 / 파일 선택.

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** 백업 JSON을 파일로 내보낸다. 사용자가 공유 시트를 닫아도 실패가 아니다. */
export async function shareBackupFile(json: string, fileName: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) throw new Error('공유를 쓸 수 없는 기기입니다.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: fileName });
}

/** 백업 파일을 골라 내용을 읽는다. 취소하면 null. */
export async function pickBackupText(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (Platform.OS === 'web' && asset.file) return asset.file.text();
  return new File(asset.uri).text();
}
