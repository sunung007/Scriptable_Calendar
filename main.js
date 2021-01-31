// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
// Part : user
const userSetting = {
  // 버튼
  buttons  : [   // 위젯 아래의 버튼들
    // 형식 : ['SF symbol name', '단축어 이름이나 앱 url scheme']
    ['viewfinder.circle', 'kakaotalk://con/web?url=https://accounts.kakao.com/qr_check_in'], // QR 체크인
    ['k.circle', 'kakaopay://'],              // 카카오페이
    // 아래는 어플을 실행하는 버튼입니다.
    // 필요없으시면 지우셔도 됩니다. 대신 위에 number는 줄여주세요!
    ['p.circle', 'photos-redirect://'],         // 사진
    ['circle.grid.2x2', 'App-prefs://'],                // 설정
    /*...*/
  ],

  buttonSize   : 16,   // 버튼 크기
  buttonSpacer : 10, // 버튼 사이 간격


  fontSize : {       // 글자 크기
    extraSmall : 12, // 일정 내용
    small      : 13, // 배터리
    monthly    : 9,  // 달력
    battery    : 10,
  },

  font : {
    // 글꼴 : 프로파일 이름과 정확히 일치해야합니다.
    // 프로파일 : 설정 > 일반 > 프로파일
    normal : null,
    bold : null,
  },

  // 색상
  color  : {
    red  : 'F51673',
    blue : '2B69F0',
    gray : '545454',  
    // 월간 달력 색상 : hex값으로 넣으세요.
    saturday : '545454', // '2B69F0',
    sunday   : '545454', //'F51673',
  },

  calendarNumber : 2, // 캘린더/리마인더 일정 개수
  calendarSpacer : 0, // 캘린더/리마인더 일정 내용 사이 줄간격

  refreshTime : 60 * 10, // 새로고침 시간(단위 : 초)
}

// ============================================================
// Part : Developer
const scriptVersion = 'calendar-widget-v1.0'

const localFM = FileManager.local()
const iCloud = FileManager.iCloud()

const localDirectory = localFM.documentsDirectory()
const iCloudDirectory = iCloud.documentsDirectory()
const path = localFM.joinPath(localDirectory,'Gofo-calendar-widget-data-')

const widget = new ListWidget()
const dateFormatter = new DateFormatter()
dateFormatter.locale = 'ko-Kore_KR'

let settingJSON = {}
let calendarJSON = {}
let reminderJSON = {}
let localeJSON = {}

let VIEW_MODE
let contentColor
let container, box, outbox, stack, batteryBox

// About calendar [calendar, reminder, monthly]
let showCalendar = [true, true, true]
let calendarSource = []
let isCalendarRight = false
let calendarPeriod

// Start main code. ==============================================
// Check version and update.
await updateScript()

// Set widget's attributes.
setWidgetAttribute()

// Bring json files.
await fetchJSONs()

// Create a widget.
createWidget()

// Refresh for every minute.
widget.refreshAfterDate = new Date(Date.now() + 
                                  (1000 * userSetting.refreshTime))
widget.setPadding(10,10,10,10)

if(settingJSON.backgroundType != 'invisible') {
  if(VIEW_MODE == 1) widget.presentSmall()
  else if(VIEW_MODE == 2) widget.presentMedium()
  else widget.presentLarge()
}

Script.setWidget(widget)
Script.complete()


// Function : update ============================================
async function updateScript() {
  const url = 'https://raw.githubusercontent.com/sunung007/Scriptable_Calendar/main/version.json'
  const updatePath = iCloud.joinPath(iCloudDirectory,
                                     'Gofo_달력 위젯 업데이트.js')
                                    
  if(iCloud.fileExists(updatePath)) {
    iCloud.remove(updatePath)
  }
  
  // version check
  const request = await new Request(url).loadJSON()
  const new_version = Number(request.version)
  const cur_version = Number(scriptVersion.substring(17))

  console.log(cur_version);
  
  // install update file
  if(new_version > cur_version) {
    const noti = new Notification()
    noti.title = '[Gofo] 달력 위젯'
    noti.body = '새로운 업데이트 파일이 있습니다. 업데이트를 진행합니다.'
    noti.schedule()
    
    const update = await new Request(request.path).loadString()
    iCloud.writeString(updatePath, update)
    await WebView.loadURL('scriptable:///run/' 
                          + encodeURI('Gofo_달력 위젯 업데이트'))
  }
}

// Function : create widget =======================================
function createWidget() {
  container = widget.addStack()
  container.layoutVertically()

  outbox = container.addStack()
  outbox.layoutHorizontally()

  if (VIEW_MODE == 2) {
    if (showCalendar[2]) {
      setMonthlyDateWidget();
      outbox.addSpacer(18);
    }
    setCalendarWidget();

    container.addSpacer();
    outbox = container.addStack();
    
    box = outbox.addStack();
    box.layoutVertically();  
    box.addSpacer((userSetting.buttonSize-userSetting.fontSize.battery)/2);

    setBatteryWidget();

    outbox.addSpacer();
    setButtonsWidget(); // buttons
  }
}

// Make battery widget.
function setBatteryWidget() {
  let line, content

  // Battery information.
  const batteryLevel = Device.batteryLevel()
  let image = getBatteryImage(batteryLevel)

  line = box.addStack()
  line.layoutHorizontally()
  line.centerAlignContent()

  // Add, color, and resize battery icon.
  content = line.addImage(image)
  if(Device.isCharging()) {
    content.imageSize = new Size(userSetting.fontSize.battery*1.8, userSetting.fontSize.battery)
    content.tintColor = Color.green()
  } else {
    content.imageSize = new Size(userSetting.fontSize.battery*2, userSetting.fontSize.battery)
    if(batteryLevel*100 <= 20) content.tintColor = Color.red()
    else content.tintColor = contentColor
  }

  line.addSpacer(2)

  // Text
  setText(line, Math.floor(batteryLevel*100)+'%',
          userSetting.fontSize.battery)
}

// Make buttons.
function setButtonsWidget() {
  const shortcutURL = 'shortcuts://run-shortcut?name='
  let url, button, image

  stack = outbox.addStack()
  const buttons = userSetting.buttons
  for(let i = 0 ; i < buttons.length ; i++) {
    image = SFSymbol.named(buttons[i][0]).image
    button = stack.addImage(image)
    button.tintColor = contentColor
    button.imageSize = new Size(userSetting.buttonSize, userSetting.buttonSize)
    // If url is url scheme of baisc app
    if(buttons[i][1].indexOf('://') < 0) {
      button.url = shortcutURL + encodeURI(buttons[i][1])
    }
    else button.url = buttons[i][1]
    stack.addSpacer(userSetting.buttonSpacer)
  }
}

// Make calendar widget shown in large size.
function setCalendarWidget() {
  let title, color, line, content

  // default : do not show
  let maxNum = userSetting.calendarNumber // max number of line each has
  let calendarNum = -1
  let reminderNum = -1
  let calendarLength, reminderLength

  // 0 : calendar / 1 : reminder / 2 : monthly date
  if(!showCalendar[0] || !showCalendar[1]) maxNum = maxNum*2
  if(showCalendar[0]) {
    calendarLength = calendarJSON.length
    calendarNum = calendarLength > maxNum ? maxNum : calendarLength
  }
  if(showCalendar[1]) {
    reminderLength = reminderJSON.length
    reminderNum = reminderLength > maxNum ? maxNum : reminderLength
  }

  if(showCalendar[0] && showCalendar[1]) {
    if(calendarNum <= maxNum && reminderLength > maxNum) {
      reminderNum += maxNum - calendarNum
      if(reminderNum > reminderLength) {
        reminderNum = reminderLength
      }
    }
    else if(calendarLength > maxNum && reminderNum <= maxNum) {
      calendarNum += maxNum - reminderNum
      if(calendarNum > calendarLength) {
        calendarNum = calendarLength
      }
    }
  }

  box = outbox.addStack()
  box.layoutVertically()
  stack = box.addStack()
  stack.layoutVertically()

  // Show calendar
  if(showCalendar[0]) {
    stack.url = 'calshow://'
    line = stack.addStack()
    if(isCalendarRight) line.addSpacer()
    setText(line, localeJSON.calendar,userSetting.fontSize.small, true)
    if(calendarNum == 0) {
      setText(line, ' 0', userSetting.fontSize.small, true, userSetting.color.gray)
    }
    else {
      if(calendarJSON.length > calendarNum) {
        let text = ' +'+(calendarJSON.length-calendarNum)
        setText(line, text, userSetting.fontSize.small, true, userSetting.color.gray)
      }
      stack.addSpacer(userSetting.calendarSpacer)
      getCalendarContent(calendarNum, calendarJSON,
                         isCalendarRight, true)
    }
  }

  if(showCalendar[0] && showCalendar[1]) {
    stack.addSpacer(10)
    stack = box.addStack()
    stack.layoutVertically()
  }

  // Show reminder
  if(showCalendar[1]) {
    stack = box.addStack()
    stack.layoutVertically()
    stack.url = 'x-apple-reminderkit://'
    line = stack.addStack()

    if(isCalendarRight) line.addSpacer()
    setText(line, localeJSON.reminder, userSetting.fontSize.small, true)
    if(reminderNum == 0) {
      setText(line, '0', userSetting.fontSize.small, true, userSetting.color.gray)
    }
    else {
      if(reminderJSON.length > reminderNum) {
        let text = ' +'+(reminderJSON.length-reminderNum)
        setText(line, text, userSetting.fontSize.small, true, userSetting.color.gray)
      }
      stack.addSpacer(userSetting.calendarSpacer)
      getCalendarContent(reminderNum, reminderJSON,
                         isCalendarRight, false)
    }
  }
}

// Show monthly calendar when user choose option.
function setMonthlyDateWidget() {
  const days = [localeJSON.sun, localeJSON.mon, localeJSON.tue,
                localeJSON.wen, localeJSON.thu, localeJSON.fri,
                localeJSON.sat]
  let width = userSetting.fontSize.monthly*1.4
  let content, color

  let date = new Date()
  let nowDate = date.getDate()
  date.setDate(1)
  let firstDay = date.getDay()
  date.setMonth(date.getMonth()+1)
  date.setDate(0)
  let lastDate = date.getDate()

  box = outbox.addStack()
  box.url = 'calshow://'
  box.layoutVertically()

  // month
  dateFormatter.dateFormat = 'MMM'
  setText(box, dateFormatter.string(date), userSetting.fontSize.small, true)
  box.addSpacer(6);
  stack = box.addStack()
  stack.layoutHorizontally()

  // 내용
  for(let i = 0 ; i < 7 ; i++) {
    // 줄바꿈
    let line = stack.addStack()
    line.layoutVertically()
    line.size = new Size(width, 0)

    let inline = line.addStack()
    inline.size = new Size(width, 0)
    inline.layoutHorizontally()
    inline.centerAlignContent()

    let color = (i==0?userSetting.color.sunday:(i==6?userSetting.color.saturday:null))

    // 요일
    setText(inline, days[i], userSetting.fontSize.monthly, false, color)
    line.addSpacer(5)

    // 공백
    if(i < firstDay) {
      inline = line.addStack()
      inline.size = new Size(width, 0)
      inline.centerAlignContent()
      setText(inline, ' ', userSetting.fontSize.monthly)
      line.addSpacer(4)
    }

    // 날짜
    let j = (i<firstDay? 8-firstDay+i : i-firstDay+1)
    for( ; j <= lastDate ; j += 7) {
      inline = line.addStack()
      inline.size = new Size(width, 0)
      inline.centerAlignContent()

      if(nowDate == j) {
        setText(inline,j+'',userSetting.fontSize.monthly,true,
                userSetting.color.red)
      }
      else {
        setText(inline,j+'',userSetting.fontSize.monthly,
                false,color)
      }
      line.addSpacer(4)
    }
    if(i < 6) stack.addSpacer(4)
  }
}

// Functions for making each widget.==========================
// Fetch JSON files.
async function fetchJSONs() {
  // Calendar and reminder data.
  try {
    // Calendar
    if(showCalendar[0]) {
      let today = new Date()
      let end = new Date()
      today.setHours(0)
      today.setMinutes(0)
      today.setSeconds(0)

      if(calendarPeriod == 'today') {
        calendarJSON = await CalendarEvent.today(calendarSource)
      }
      else if(calendarPeriod == 'thisMonth') {
        end.setMonth(end.getMonth() + 1)
        end.setDate(-1)
        calendarJSON = await CalendarEvent.between(today, end,
                                           calendarSource)
      }
      else if(calendarPeriod == 'thisWeek') {
        end.setDate(end.getDate() + 6 - end.getDay())
        calendarJSON = await CalendarEvent.between(today, end,
                                           calendarSource)
      }
      else {
        end.setDate(end.getDate()+parseInt(calendarPeriod))
        calendarJSON = await CalendarEvent.between(today, end,
                                           calendarSource)
      }
    }
    // Reminder
    if(showCalendar[1]) {
      reminderJSON = await Reminder.allIncomplete()
      reminderJSON.sort(sortReminder)
    }
  }
  catch { console.error('Error : Load calendar data') }

  // Function : Sort reminder content for date
  function sortReminder(a, b) {
    if(a.dueDate == null & b.dueDate == null) {
      compareCreationDate()
    }
    else if(a.dueDate != null && b.dueDate == null) return -1
    else if(a.dueDate == null && b.dueDate != null) return 1
    else {
      if(a.dueDate == b.dueDate) compareCreationDate()
      else if(a.dueDate < b.dueDate) return -1
      else return 1
    }

    function compareCreationDate() {
      if(a.creationDate  == b.creationDate) return 0
      else if(a.creationDate < b.creationDate) return -1
      else return 1
    }
  }
}

// Make and return battery icon.
function getBatteryImage(batteryLevel) {
  if(Device.isCharging()) {
    return SFSymbol.named('battery.100.bolt').image
  }

  const batteryWidth = 87
  const batteryHeight = 41

  let draw = new DrawContext()
  let image = SFSymbol.named("battery.0").image
  let rect = new Rect(0, 0, batteryWidth, batteryHeight)
  draw.opaque = false
  draw.respectScreenScale = true
  draw.size = new Size(batteryWidth, batteryHeight)
  draw.drawImageInRect(image,rect)

  // Match the battery level values to the SFSymbol.
  const x = batteryWidth * 0.1525
  const y = batteryHeight * 0.247
  const width = batteryWidth * 0.602
  const height = batteryHeight * 0.505

  // Determine the width and radius of the battery level.
  const current = width * batteryLevel
  let radius = height / 6.5

  // When it gets low, adjust the radius to match.
  if (current < (radius*2)) radius = current / 2

  // Make the path for the battery level.
  let barPath = new Path()
  let barRect = new Rect(x, y, current, height)
  barPath.addRoundedRect(barRect, radius, radius)
  draw.addPath(barPath)
  draw.setFillColor(contentColor)
  draw.fillPath()

  return draw.getImage()
}

// Make components of calender and reminder
function getCalendarContent(num, json, right, isCalendar) {
  if(right != true) right = false

  let draw = new DrawContext()
  draw.opaque = false
  draw.respectScreenScale = true
  draw.fillEllipse(new Rect(0, 0, 200, 200))
  let circle = draw.getImage()

  dateFormatter.dateFormat = 'd'

  for(let i = 0 ; i < num; i++ ) {
    line = stack.addStack()
    line.layoutHorizontally()
    line.centerAlignContent()

    // Get title and bar's color from JSON file.
    title = json[i].title
    color = json[i].calendar.color.hex

    // Draw circle
    if(right) line.addSpacer()
    content = line.addImage(circle)
    content.imageSize = new Size(userSetting.fontSize.extraSmall-3,
                                 userSetting.fontSize.extraSmall-9)
    content.tintColor = new Color(color)

    // In calendar set period
    let period = ''
    if(isCalendar && calendarPeriod != 'today') {
      let startDate = json[i].startDate
      let endDate = json[i].endDate
      if(startDate != null && endDate != null) {
        startDate = dateFormatter.string(startDate)
        endDate = dateFormatter.string(endDate)
        if(startDate == endDate) period += startDate // 당일
        else period = startDate + '-' + endDate
        period += ' | '
      }
    }

    // Add text
    content = setText(line, period + title, 
                      userSetting.fontSize.extraSmall)
    content.lineLimit = 1
    
    stack.addSpacer(userSetting.calendarSpacer)
  }
}


// Functions : etc =============================================
// Function : change text settings.
function setText(stack, text, size, bold, colorHex) {
  if(bold != true) bold = false
  let content = stack.addText(text)

  try {
    if(userSetting.font.normal == null) throw error
    if(bold) content.font = new Font(userSetting.font.bold, size)
    else content.font = new Font(userSetting.font.normal, size)
  }
  catch {
    // bold and size
    if(bold) content.font = Font.boldSystemFont(size)
    else content.font = Font.systemFont(size)
  }

  // color
  if(colorHex == null) content.textColor = contentColor
  else content.textColor = new Color(colorHex)

  return content
}


// Function : Set widget background color or content color
// Argument
// {type} 0(set widget background color) - 1(set content color)
// {colorNumber} -1(make alert) others(just change color)
function setColor(type, colorNumber) {
  let color
  if(colorNumber == 5) {
    colorNumber = Device.isUsingDarkAppearance() ?
                  type : 1-type
  }
  if(colorNumber == 0) color = Color.black()
  else if(colorNumber == 1) color = Color.white()
  else if(colorNumber == 2) color = Color.yellow()
  else if(colorNumber == 3) color = Color.green()
  else if(colorNumber == 4) color = Color.blue()

  if(type == 0) widget.backgroundColor = color
  else if(type == 1) contentColor = color
}

// Function : fetch locale to letters.
function setLocaleLanguage(locale) {
  let fetch = false
  if(locale == 'en') {
    dateFormatter.locale = 'en'
    fetch = true
  }
  else dateFormatter.locale = 'ko-Kore_KR'

  localeJSON.year       = !fetch ? 'yy년'    : 'y,'
  localeJSON.day        = !fetch ? 'EEEE'    : 'E'
  localeJSON.calendar   = !fetch ? '일정'     : 'Calendar'
  localeJSON.reminder   = !fetch ? '미리알림'  : 'Reminder'

  localeJSON.sun        = !fetch ? '일' : 'S'
  localeJSON.mon        = !fetch ? '월' : 'M'
  localeJSON.tue        = !fetch ? '화' : 'T'
  localeJSON.wen        = !fetch ? '수' : 'W'
  localeJSON.thu        = !fetch ? '목' : 'T'
  localeJSON.fri        = !fetch ? '금' : 'F'
  localeJSON.sat        = !fetch ? '토' : 'S'
}


// Funciton : widget setting ====================================
// Set basic settings of widget.
async function setWidgetAttribute() {
  fetchSettingScript()
  
  if(!localFM.fileExists(path+'settingJSON')) {
    return fetchSettingScript(true)
  }

  // Load settingJSON file.
  settingJSON = JSON.parse(localFM.readString(path+'settingJSON'))
  console.log('설정 파일을 로드 성공')

  if(settingJSON.backgroundType == 'invisible' &&
     !localFM.fileExists(path+'backgroundImage')) {
    const noti = new Notification()
    noti.title = '[Gofo] 달력 위젯'
    noti.body = '투명 설정이 정상적으로 진행되지 않았습니다. '
                + '설정을 다시 진행합니다.'
    noti.schedule()

    const scriptPath = iCloud.joinPath(iCloudDirectory,
                                       'Gofo_투명 위젯 설정')
    if(iCloud.fileExists(scriptPath)) {
      await WebView.loadURL('scriptable:///run/'
                            + encodeURI('Gofo_투명 위젯 설정'))
    }
    else fetchSettingScript(true)
    settingModule.invisibleWidget()
    return
  }

  setColor(1, Number(settingJSON.contentColor))
  setLocaleLanguage(settingJSON.locale)
  VIEW_MODE = 2 //Number(settingJSON.widgetSize)
  const backgroundType = settingJSON.backgroundType

  if((backgroundType + VIEW_MODE).indexOf('undefined') >= 0) {
    return fetchSettingScript(true)
  }

  if(VIEW_MODE > 1) {
    let array = (settingJSON.largeWidgetSetting).split(',')
    let calendarList = settingJSON.calendarSource.split(',')
    
    showCalendar[0] = array[0] == 'true'
    showCalendar[1] = array[1] == 'true'
    showCalendar[2] = array[2] == 'true'
    if(showCalendar[0]) calendarPeriod = settingJSON.calendarPeriod
    isCalendarRight = settingJSON.isCalendarRight == 'true'
    
    try {
      for(let i in calendarList) {
        calendarSource.push(await Calendar.forEventsByTitle
                                           (calendarList[i]))
      }
    }
    catch {
      const noti = new Notification()
      noti.title = '[Gofo] 달력 위젯'
      noti.body = '캘린더가 올바르게 지정되지 않았습니다. 다시 지정해주세요.'
      noti.schedule()

      fetchSettingScript(true)
    }
  }

  if(backgroundType == 'bookmark') {
    widget.backgroundImage = await localFM.readImage(settingJSON.bookmark)
  }
  else if(backgroundType == 'background') {
    widget.backgroundImage = await localFM.readImage(path + 'backgroundImage')
  }
  else if(backgroundType == 'color') {
    setColor(0, Number(settingJSON.backgroundColorNumber))
  }
  else if(backgroundType == 'invisible') {
    settingJSON.backgroundType = 'background'
    widget.backgroundImage = await localFM.readImage(path + 'backgroundImage')

    localFM.writeString(path+'settingJSON',
                        JSON.stringify(settingJSON))

    const filePath = iCloud.joinPath(iCloudDirectory,
                                     'Gofo_투명 위젯 설정.js')
    if(iCloud.fileExists(filePath)) iCloud.remove(filePath)
  }


  async function fetchSettingScript(run) {
    const url = 'https://raw.githubusercontent.com/sunung007/Scriptable_Calendar/main/setting.js'
    const filePath = iCloud.joinPath(iCloud.documentsDirectory(),
                                     'Gofo_달력 위젯 설정.js')

    if(!iCloud.fileExists(filePath)) {
      const request = await new Request(url).loadString()
      console.log('Save setting script.')
      iCloud.writeString(filePath, request)
      run = true
      console.log(request)
    }

    if(run) {
      await WebView.loadURL('scriptable:///run/'
                            + encodeURI('Gofo_달력 위젯 설정'))
    }
  }
}
