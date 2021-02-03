// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: download;
update()

// Functions ======================================================
async function update() {
    console.log('업데이트를 시작합니다.')
    console.log('파일 로드 중...')

    const fileManager = FileManager.iCloud()
    const directory = fileManager.documentsDirectory()
    const path = fileManager.joinPath(directory, 'Gofo_달력 위젯.js')
    const url = 'https://raw.githubusercontent.com/sunung007/Scriptable_Calendar/main/main.js'
    const newFile = await new Request(url).loadString()

    // ------------------------------------------------------------

    // Refetch setting file
    const settingURL = 'https://raw.githubusercontent.com/sunung007/'
        + 'Scriptable_Calendar/main/setting.js'
    const settingPath = fileManager.joinPath(directory,
        'Gofo_달력 위젯 설정.js')
    if(fileManager.fileExists(settingPath)) {
        console.log("기존의 설정 스크립트를 재설치합니다.")
        const settingRequest = await new Request(settingURL)
            .loadString()
        console.log(settingRequest)
        fileManager.writeString(settingPath, settingRequest)
    }

    // 파일 작성
    try {
        fileManager.writeString(path, newFile)
        console.log('성공적으로 설치했습니다.')
        await WebView.loadURL("scriptable:///run/"+encodeURI("Gofo_달력 위젯"))
    } catch {
        console.log('설치에 실패했습니다.')
    }
}