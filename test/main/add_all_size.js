// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: calendar-alt;
/*
위젯명 : Gofo_달력 위젯

본 코드는 Gofo에 의해 작성되었습니다.
본 코드를 복제/공유 시 발생하는 문제에 대해서는 책임지지 않으며, 전적으로 사용자에게 책임이 있습니다.

본 위젯은 Scriptable을 이용합니다.
본 위젯 및 코에 대한 자세한 내용 및 문의는 아래를 참고해주십시오.

https://gofo-coding.tistory.com/category/Scriptable/달력%20위젯
https://gofo-coding.tistory.com/category/Scriptable/공통
*/

// Part : user
const userSetting = {
  // 버튼 관련
  buttons  : [   // 위젯 아래의 버튼들
                 // 형식 : ['SF symbol name', '단축어 이름이나 앱 url scheme']
    ['viewfinder.circle', 'kakaotalk://con/web?url=https://accounts.kakao.com/qr_check_in'], // QR 체크인
    ['k.circle', 'kakaopay://'],              // 카카오페이
    ['p.circle', 'photos-redirect://'],       // 사진
    ['circle.grid.2x2', 'App-prefs://'],      // 설정
    /*...*/
  ],

  buttonSize   : 16,  // 버튼 크기
  buttonSpacer : 10, // 버튼 사이 간격

  // 글자 크기
  fontSize : {       // 글자 크기
    extraSmall : 12, // 일정 내용, 배터리 정보, 날씨
    small      : 13, // 일정/미리알림/월 타이틀
    monthly    : 9,  // 달력
  },

  // 글꼴 : 프로파일 이름과 정확히 일치해야합니다.
  // 프로파일 : 설정 > 일반 > 프로파일
  // 프로파일 입력 시 따옴표('')로 감싸야합니다.
  // 예시 : 'Nanum'
  font : {
    normal : null,
    bold : null,
  },

  // 색상 : 따옴표('') 안에 HEX 값으로 넣으세요.
  color  : {
    red  : 'F51673',
    blue : '2B69F0',
    today  : 'F51673',   // 달력의 오늘 날짜의 동그라미
    saturday : '545454', // 달력의 토요일
    sunday   : '545454', // 달력의 일요일
    calendarCount : '545454', // 일정/미리알림 옆에 글씨
  },

  monthCalendarNumber : 3, // 달력 일정의 개수
  calendarNumber      : 2, // 캘린더/리마인더 각 일정의 개수
  calendarSpacer      : 0, // 캘린더/리마인더 일정 내용 사이 줄간격

  refreshTime : 60 * 10, // 새로고침 시간(단위 : 초)

  /*
 아래 사이트에 들어가서 활용 신청한 후 발급받은 일반 인증키를 붙여넣으시면 됩니다!
 웬만하면 발급 받으시는게 좋을겁니다... 터지면 저는 재발급받을테니까요..
 https://data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15057682
 */
  appKey : 'e8AFfWnF9M5a355DPc9CSmzWHBW5JhXMfqg7vsEVIcqr9ZaS70Ahr%2FETSdFC1o5TUybHaANphNqbJR0aeZj6dA%3D%3D',
};

// ============================================================
/*
|--------------------------------------|
|  Point Line -------------------------|
|  - Change from this line in update.  |
|  - Do not edit this line.            |
|--------------------------------------|
|  Part : Developer                    |
|--------------------------------------|
 */
// ============================================================

const
  scriptVersion = 'calendar-widget-v1.0', // 위젯 버전

  localFM = FileManager.local(),
  iCloud = FileManager.iCloud(),
  localDirectory = localFM.documentsDirectory(),
  iCloudDirectory = iCloud.documentsDirectory(),
  path = localFM.joinPath(localDirectory, 'Gofo-calendar-widget-data-'),

  widget = new ListWidget(),
  dateFormatter = new DateFormatter();

let
  settingJSON = {},
  weatherJSON = {},
  calendarJSON = {},
  reminderJSON = {},
  localeJSON = {},

  // About calendar [calendar, reminder, monthly]
  showCalendar = [true, true, true],
  isCalendarRight = false,
  calendarPeriod,
  showCalendarTime,

  calendarSource = [],
  reminderSource = [],
  thisMonthCalendar = [],

  // About widget
  VIEW_MODE,
  contentColor,
  container, box, outbox, stack;

// Main code. =================================================

dateFormatter.locale = 'ko-Kore_KR';

await checkVersion();       // Check version and update.
await setWidgetAttribute(); // Set widget's attributes.
await fetchJSONs();         // Bring json files.
createWidget();             // Create a widget.


// Set refresh time.(unit : milliseconds.
widget.refreshAfterDate = new Date(Date.now() + (1000 * userSetting.refreshTime));

// Show widget.
if(settingJSON.backgroundType !== 'invisible') {
  if(VIEW_MODE === 1) widget.presentSmall();
  else if(VIEW_MODE === 2) widget.presentMedium();
  else widget.presentLarge();
}

// Set widget.
Script.setWidget(widget);
Script.complete();

// ============================================================

/*
 * Function
 * Check newest version, then if there is a new version of script, update to it.
 * @non-return
 */
async function checkVersion() {
  const url = 'https://raw.githubusercontent.com/sunung007/Scriptable_Calendar/main/version.json';
  const updatePath = iCloud.joinPath(iCloudDirectory, 'Gofo_달력 위젯 업데이트.js');

  if(iCloud.fileExists(updatePath)) {
    iCloud.remove(updatePath);
  }

  // version check
  const request = await new Request(url).loadJSON();
  const new_version = Number(request.version);
  const cur_version = Number(scriptVersion.substring(17));

  // install update file
  if(new_version > cur_version) {
    const noti = new Notification();
    noti.title = '[Gofo] 달력 위젯';
    noti.body = '새로운 업데이트 파일이 있습니다. 업데이트를 진행합니다.';
    noti.schedule();

    const update = await new Request(request.path).loadString();
    iCloud.writeString(updatePath, update);
    await WebView.loadURL('scriptable:///run/'
        + encodeURI('Gofo_달력 위젯 업데이트'));
  }
}

/*
 * Function
 * Run each functions that make widget's part.
 * @non-return
 */
function createWidget() {
  container = widget.addStack();
  container.layoutVertically();

  outbox = container.addStack();
  outbox.layoutHorizontally();

  // 작은 사이즈
  if(VIEW_MODE === 1) {
    const monthlySpacer = 7;
    outbox.size = new Size((userSetting.fontSize.monthly*1.4)*7 + monthlySpacer*6, 0);
    
    // 맨 상단의 월
    dateFormatter.dateFormat = 'MMM';
    setText(
      outbox,
      dateFormatter.string(new Date()),
      userSetting.fontSize.small,
      true
    );
    // 월 왼쪽 정렬
    outbox.addSpacer(); 

    box = outbox.addStack();
    box.centerAlignContent();

    // 날씨
    setWeatherWidget(true);
    // 날씨 - 배터리 사이 여백
    box.addSpacer(6);
    // 배터리
    setBatteryWidget(false, true);

    // 날짜 - 달력 간 줄 간격
    container.addSpacer(8);

    outbox = container.addStack();
    outbox.layoutHorizontally();

    // 달력
    setMonthlyDateWidget(monthlySpacer, false);
  }

  // 중간 사이즈
  else if (VIEW_MODE === 2) {
    // 달력
    if(showCalendar[2]) {
      setMonthlyDateWidget(4, true);
      outbox.addSpacer(18);
    }
    // 일정 내용
    setCalendarWidget();

    container.addSpacer();
    outbox = container.addStack();
    outbox.centerAlignContent();

    box = outbox.addStack();
    box.layoutVertically();
    box.centerAlignContent();

    // 배터리
    setBatteryWidget(true, true);

    outbox.addSpacer(4);
    box = outbox.addStack();
    box.layoutVertically();
    box.centerAlignContent();

    // 날씨
    setWeatherWidget(true);

    outbox.addSpacer();

    // 버튼
    setButtonsWidget();
  }

  // 큰 사이즈
  else if(VIEW_MODE === 3) {
    outbox = container.addStack();
    outbox.layoutHorizontally();
    outbox.size = new Size(Device.screenSize().height/2.8, 0)
    
    // 월
    dateFormatter.dateFormat = localeJSON.today;
    setText(
      outbox,
      dateFormatter.string(new Date()),
      userSetting.fontSize.small,
      true
    );
    
    // 월 - 배터리/날씨 사이 공백
    outbox.addSpacer();
    
    box = outbox.addStack();
    box.layoutVertically();
    box.centerAlignContent();

    // 배터리
    setBatteryWidget(true, true);
    
    // 배터리-날씨 사이 여백
    outbox.addSpacer(4);
    
    box = outbox.addStack();
    box.layoutVertically();    
    box.centerAlignContent();

    // 날씨
    setWeatherWidget(true);
    
    // 아래 줄간격
    container.addSpacer(8);   
    
    outbox = container.addStack();
    outbox.layoutHorizontally();
    
    // 달력
    setLargeMonthlyDateWidget();
  }
}

/*
 * Function
 * Shows battery left icon and percentage.
 * @params {showIcon} : boolean, if true show battery icon.
 * @params {showPercent} : boolean, if true show percentage of battery left in text.
 * @non-return
 */
function setBatteryWidget(showIcon, showPercent) {
  const batteryLevel = Device.batteryLevel();
  let line, content;

  line = box.addStack()
  line.layoutHorizontally()
  line.centerAlignContent()

  // 배터리 아이콘
  if(showIcon) {
    content = line.addImage(getBatteryImage(batteryLevel));
    // 충전 중
    if (Device.isCharging()) {
      content.imageSize = new Size(
        userSetting.fontSize.extraSmall * 1.8,
        userSetting.fontSize.extraSmall
      );
      content.tintColor = Color.green();
    }
    // 배터리 부족
    else {
      content.imageSize = new Size(
        userSetting.fontSize.extraSmall * 2,
        userSetting.fontSize.extraSmall
      );
      if (batteryLevel * 100 <= 20) content.tintColor = Color.red();
      else content.tintColor = contentColor;
    }
  }

  // 퍼센트
  if(showPercent) {
    line.addSpacer(2)
    setText(line, Math.floor(batteryLevel*100) + '%',
        userSetting.fontSize.extraSmall)
  }
}

/*
  * Function
  * Shows current weather status of user's location.
  * @params {showText} : boolean, if true show current temperature in text.
  * @non-return
 */
function setWeatherWidget(showText) {
  let response, temp, rain, sky, volume;

  try {
    response = weatherJSON.response;
  }
  catch {
    console.error('ERROR in extract data frorm weather json.');
    console.error('다시 시도해주시기 바랍니다.');
    return;
  }

  // Error code in loading weather
  if(response.header.resultCode !== '00') {
    console.error('ERROR in weather loading : ' +
        response.header.resultCode);
    console.error(response.header.resultMsg);
    return;
  }

  // Extract weather data from JSON file.
  const weatherItems = response.body.items.item;
  const fcstTime = weatherItems[0].fcstTime;

  for(let entry of weatherItems) {
    if(entry.fcstTime === fcstTime) {
      const category = entry.category;
      
      if(category === 'T1H') temp = entry.fcstValue+'℃';
      else if(category === 'SKY') sky = parseInt(entry.fcstValue) -1;
      else if(category === 'PTY') rain = parseInt(entry.fcstValue);
      else if(category === 'RN1') volume = parseInt(entry.fcstValue);
    }
  }

  let line, content;
  line = box.addStack();
  line.layoutHorizontally();
  line.centerAlignContent();
  line.url = 'http://weather.naver.com';

  // 날씨 아이콘
  content = line.addImage(getWeatherImage(rain, sky, volume));
  content.tintColor = contentColor;
  //line.size = new Size(userSetting.fontSize.extraSmall + 3, 0);
  content.imageSize = new Size(userSetting.fontSize.extraSmall*2, userSetting.fontSize.extraSmall*1.1);

  // 온도 글씨
  if(showText) {
    line.addSpacer(2);
    setText(line, temp, userSetting.fontSize.extraSmall);
  }
}

/*
 * Function
 * Shows buttons edited by users.
 * The setting code of icons and function is top in script.
 * Each buttons is run using URL Scheme of iOS or REST API.
 * @non-return
 */
function setButtonsWidget() {
  const
    shortcutURL = 'shortcuts://run-shortcut?name=',
    buttons = userSetting.buttons;

  stack = outbox.addStack();

  for(let i of buttons) {
    stack.addSpacer(userSetting.buttonSpacer);

    let button = stack.addImage(SFSymbol.named(i[0]).image);
    button.tintColor = contentColor;
    button.imageSize = new Size(userSetting.buttonSize, userSetting.buttonSize);

    // If url is url scheme of baisc app
    if(i[1].indexOf('://') < 0) {
      button.url = shortcutURL + encodeURI(i[1]);
    }
    else button.url = i[1];
  }
}

/*
 * Function
 * Shows calendar content in medium size widget.
 * In other size, not shown.
 *
 * In function, showCalendar[] is array that contains whether to show.
 * [0] : calendar
 * [1] : reminder
 * [2] : monthly date
 */
function setCalendarWidget() {
  let
    maxNum = userSetting.calendarNumber, // max number of line each has
    calendarNum = -1,                    // default : do not show
    reminderNum = -1,                    // default : do not show
    calendarLength, reminderLength,
    line;

  if(!showCalendar[0] || !showCalendar[1]) maxNum *= 2;
  if(showCalendar[0]) {
    calendarLength = calendarJSON.length;
    calendarNum = calendarLength > maxNum ? maxNum : calendarLength;
  }
  if(showCalendar[1]) {
    reminderLength = reminderJSON.length;
    reminderNum = reminderLength > maxNum ? maxNum : reminderLength;
  }

  if(showCalendar[0] && showCalendar[1]) {
    if(calendarNum <= maxNum && reminderLength > maxNum) {
      reminderNum += maxNum - calendarNum;
      if(reminderNum > reminderLength) {
        reminderNum = reminderLength;
      }
    }
    else if(calendarLength > maxNum && reminderNum <= maxNum) {
      calendarNum += maxNum - reminderNum;
      if(calendarNum > calendarLength) {
        calendarNum = calendarLength;
      }
    }
  }

  box = outbox.addStack();
  box.layoutVertically();
  stack = box.addStack();
  stack.layoutVertically();

  // Show calendar
  if(showCalendar[0]) {
    stack.url = 'calshow://';
    line = stack.addStack();
    if(isCalendarRight) line.addSpacer();
    setText(
      line,
      localeJSON.calendar,
      userSetting.fontSize.small,
      true
    );

    if(calendarNum === 0) {
      setText(line,
        ' 0',
        userSetting.fontSize.small,
        true,
        userSetting.color.calendarCount
      );
    }
    else {
      if(calendarJSON.length > calendarNum) {
        setText(
          line,
          ' +'+(calendarJSON.length-calendarNum),
          userSetting.fontSize.small,
          true,
          userSetting.color.calendarCount
        );
      }
      stack.addSpacer(userSetting.calendarSpacer);
      getCalendarContent(
        calendarNum,
        calendarJSON,
        isCalendarRight,
        true
      );
    }
  }

  if(showCalendar[0] && showCalendar[1]) {
    stack.addSpacer(10);
    stack = box.addStack();
    stack.layoutVertically();
  }

  // Show reminder
  if(showCalendar[1]) {
    stack = box.addStack();
    stack.layoutVertically();
    stack.url = 'x-apple-reminderkit://';
    line = stack.addStack();

    if(isCalendarRight) line.addSpacer();
    setText(
      line,
      localeJSON.reminder,
      userSetting.fontSize.small,
      true
    );

    if(reminderNum === 0) {
      setText(
        line,
        '0',
        userSetting.fontSize.small,
        true,
        userSetting.color.calendarCount
      );
    }
    else {
      if(reminderJSON.length > reminderNum) {
        setText(
          line,
          ' +'+(reminderJSON.length-reminderNum),
          userSetting.fontSize.small,
          true,
          userSetting.color.calendarCount
        );
      }
      stack.addSpacer(userSetting.calendarSpacer)
      getCalendarContent(
        reminderNum,
        reminderJSON,
        isCalendarRight,
        false
      );
    }
  }
}

/*
 * Function
 * Show monthly calendar that has calendar bar at every week in large size widget.
 * @non-return
 */
function setLargeMonthlyDateWidget() {
  const
    // 달력 맨 윗줄의 요일들
    days = [
      localeJSON.sun,
      localeJSON.mon,
      localeJSON.tue,
      localeJSON.wen,
      localeJSON.thu,
      localeJSON.fri,
      localeJSON.sat
    ],

    // 일정 줄의 한칸 너비
    width = Device.screenSize().height / (7 * 2.8),
    //userSetting.fontSize.monthly * 4.3;
    date = new Date();

  let
    iconStack = [],
    iconStackCount = [],
    weekStartDate = [1];

  const
    nowDate = date.getDate(), // 오늘 날짜
    thisMonth = date.getMonth() + 1; // 이번 달의 월

  // 1일의 요일
  date.setDate(1);
  const firstDay = date.getDay();

  // 월의 마지막 일
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  const lastDate = date.getDate();

  box = outbox.addStack();
  box.layoutVertically();
  stack = box.addStack();
  stack.layoutHorizontally();

  // 요일
  for(let i = 0 ; i < 7 ; i++) {  
    const line = stack.addStack();
    line.size = new Size(width, 0);
    
    const color =
      i === 0 ?
        userSetting.color.sunday :
        (i === 6 ?
          userSetting.color.saturday : null);
    
    setText(line, days[i], userSetting.fontSize.monthly, false, color);
  }
  
  // 줄바꿈
  stack = box.addStack();
  stack.layoutHorizontally();
  
  // 공백
  for(let i = 0 ; i < firstDay ; i++) {  
    const line = stack.addStack();
    line.size = new Size(width, 0);
    line.layoutVertically();
    setText(line, ' ', userSetting.fontSize.monthly);
  }
  
  // 날짜별 스택 생성
  for(let i = 1 ; i <= lastDate ; i++) {    
    // 스택 생성
    const line = stack.addStack();
    line.size = new Size(width, 0);
    
    // 색상
    const color =
      i === nowDate ?
        userSetting.color.today :
        ((i+firstDay-1)%7 === 0 ?
          userSetting.color.sunday:
          ((i+firstDay-1)%7 === 6 ?
            userSetting.color.saturday : null));
    setText(line, i+'', userSetting.fontSize.monthly, i===nowDate, color);
    
    
    if((i+firstDay-1) % 7 === 6) {
      box.addSpacer(1); // 달력 주간사이 줄간격
      
      weekStartDate.push(i+1);
      
      // 아이콘 줄 생성
      const iconEntry = box.addStack();
      iconEntry.layoutVertically();
      iconStack[parseInt((i+firstDay-1)/7)] = [iconEntry];
      
      // 줄바꿈
      stack = box.addStack();
      stack.layoutHorizontally();
    }
  }
  
  // 마지막 주차 아이콘 줄 생성
  if((lastDate+firstDay-1) % 7 !== 6) {
    const iconEntry = box.addStack();
    iconEntry.layoutVertically();
    iconStack[parseInt((lastDate+firstDay-1)/7)] = [iconEntry];
  }
  
  // 일정 데이터 가공
  let weekCalendar = [];
  
  for(let entry of thisMonthCalendar) {
    const
      start = new Date(entry.startDate),
      end = new Date(entry.endDate);
    
    if(start.getMonth() + 1 === thisMonth && end.getMonth() + 1 === thisMonth) {
      addToWeekCalendar(start.getDate(), end.getDate(), entry, "ALL_THIS_MONTH");
    }
    else if(start.getMonth() + 1 === thisMonth) {
      addToWeekCalendar(start.getDate(), lastDate, entry, "START_THIS_MONTH");
    }
    else if(end.getMonth() + 1 === thisMonth) {
     addToWeekCalendar(1, end.getDate(), entry, "END_THIS_MONTH");
    }
    else {
      addToWeekCalendar(1, lastDate, entry, "MIDDLE");
    }
  }
  
  for(let entry of weekCalendar) {
    entry.sort(sortWeekCalendar);
  }


  // 일정 줄 표시
  for(let i = 0 ; i < iconStack.length ; i++) {  
    iconStack[i][0].size = new Size(width*7, userSetting.fontSize.monthly*5);
    iconStackCount[i] = [0];
    
    if(weekCalendar[i] === undefined) continue;
    
    for(let j = 0 ; j < weekCalendar[i].length ; j++) {
      let line, line_num;
      // add 할 줄 찾기
      for(line_num = 1 ; line_num <= iconStack[i].length ; line_num++) {
        if(line_num === iconStack[i].length) break;
        else if(iconStackCount[i][line_num] <= weekCalendar[i][j].startWeekDate) {
          break;
        }
      }

      // 이미 줄이 다 찾으면 패스
      if(line_num > userSetting.monthCalendarNumber) continue;

      // 기존 줄의 스택에 추가
      if(line_num < iconStack[i].length) {
        line = iconStack[i][line_num].addStack();
        let blank = line.addStack();
        blank.size = new Size(width * (weekCalendar[i][j].startWeekDate - iconStackCount[i][line_num]), 0);
      }
      // 새로운 줄 생성 후 추가
      else {
        line = iconStack[i][0].addStack();
        line.layoutHorizontally();
        iconStack[i].push(line);
        if(i === 0) line.addSpacer(width*firstDay);
        
        let blank = line.addStack();
        blank.size = new Size(width * weekCalendar[i][j].startWeekDate, 0);
        
        iconStackCount[i][line_num] = 0;
        iconStack[i][0].addSpacer(2);
      }

      // 일정 추가
      let content = line.addStack();
      content.size = new Size(width * weekCalendar[i][j].count, 0);
      content.backgroundColor = new Color(weekCalendar[i][j].color, 0.5);
      setText(
        content,
        weekCalendar[i][j].title.substring(0, 5*weekCalendar[i][j].count),
        userSetting.fontSize.monthly
      ).lineLimit = 1;
      content.addSpacer(); // 왼쪽 정렬

      // 일정 추가 완료된 스택을 배열에 추가
      iconStackCount[i][line_num] = weekCalendar[i][j].startWeekDate + weekCalendar[i][j].count;
    }

    // 위쪽 정렬
    iconStack[i][0].addSpacer();
  }
  
  
  function addToWeekCalendar(start, end, calendar, type) {
    const
      index_start = parseInt((start+firstDay-1)/7),
      index_end = parseInt((end+firstDay-1)/7);
    
    for(let i = index_start ; i <= index_end ; i++) {
      let temp = {
        type : type,
        
        start      : calendar.startDate,
        startMonth : new Date(calendar.startDate).getMonth() + 1,
        startDate  : new Date(calendar.startDate).getDate(),
        startWeek  : index_start,
                
        end        : calendar.endDate,
        endMonth   : new Date(calendar.endDate).getMonth() + 1,
        endDate    : new Date(calendar.endDate).getDate(),
        endWeek    : index_end,
          
        title      : calendar.title,
        isAllDay   : calendar.isAllDay,
        color      : calendar.calendar.color.hex,
      };
      
      let startWeekDate = 0, count = 7;
      if(type === "ALL_THIS_MONTH") {
        if(index_start === index_end) {
          startWeekDate = temp.startDate - weekStartDate[i];
          count = temp.endDate - temp.startDate + 1;
        }
        else if(i === index_start) {
          startWeekDate = temp.startDate - weekStartDate[i];
          count = weekStartDate[i] + 7 - temp.startDate;
        }
        else if(i === index_end) {
          count = temp.endDate - weekStartDate[i] + 1;
        }
      }
      else if(type === "START_THIS_MONTH" && i === index_start) {
        startWeekDate = temp.startDate - weekStartDate[i];
        count = weekStartDate[i] + 7 - temp.startDate;
      }
      else if(type === "END_THIS_MONTH" && i === index_end) {
        count = temp.endDate - weekStartDate[i] + 1;
      }

      if(i === weekStartDate.length-1 && count === 7) {
        count = temp.startDate - weekStartDate[i] + 1;
      }

      temp.startWeekDate = startWeekDate;
      temp.count = count;
              
      if(weekCalendar[i] === undefined) weekCalendar[i] = [];
      weekCalendar[i].push(temp);
    }
  }
  
  function sortWeekCalendar(a, b) {
    let result = a.start - b.start;
    if(result === 0) {
      return a.end - b.end;
    }
    return result;
  }
}

/*
 * Function
 * Show monthly calendar that has calendar icon at everyday
 * This part is shown in small and medium size widget.
 * @non-return
 */
function setMonthlyDateWidget(spacer, showMonth) {
  const
    days = [
      localeJSON.sun,
      localeJSON.mon,
      localeJSON.tue,
      localeJSON.wen,
      localeJSON.thu,
      localeJSON.fri,
      localeJSON.sat
    ],
    width = userSetting.fontSize.monthly*1.4,
    date = new Date(),
    thisMonth = date.getMonth() + 1;

  // 오늘 날짜
  const nowDate = date.getDate();

  // 1일의 요일
  date.setDate(1);
  const firstDay = date.getDay();

  // 월의 마지막 일
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  const lastDate = date.getDate();

  box = outbox.addStack();
  box.url = 'calshow://';
  box.layoutVertically();
  
  // 일정 데이터 가공
  let calendarIcon = {};
  
  // 이번 달 일정으로 변경...
  for(let entry of thisMonthCalendar) {
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    
    if(start.getMonth() + 1 === thisMonth) {
      let lastIndex = (end.getMonth() + 1 === thisMonth) ? end.getDate() : lastDate;
      
      for(let j = start.getDate() ; j <= lastIndex ; j++) {
        if(calendarIcon[j] === undefined) {
          calendarIcon[j] = entry.calendar.color.hex;
        }
        else {
          calendarIcon[j] += "," + entry.calendar.color.hex;
        }
      }
    } 
  }
  
  // 원 아이콘
  const draw = new DrawContext();
  draw.opaque = false;
  draw.respectScreenScale = true;
  draw.fillEllipse(new Rect(0, 0, 150, 150));
  const circle = draw.getImage();
  
  // 월
  if(showMonth) {
    dateFormatter.dateFormat = 'MMM';
    setText(
      box,
      dateFormatter.string(date),
      userSetting.fontSize.small,
      true
    );
    box.addSpacer(6);
  }
  
  // 줄바꿈
  stack = box.addStack();
  stack.layoutHorizontally();
    
  // 요일
  for(let i = 0 ; i < 7 ; i++) {  
    const line = stack.addStack();
    line.size = new Size(width, 0);
    
    const color =
      (i===0 ?
        userSetting.color.sunday :
        (i===6 ?
          userSetting.color.saturday : null));
    
    setText(
      line,
      days[i],
      userSetting.fontSize.monthly,
      false,
      color
    );
        
    if(i < 6) stack.addSpacer(spacer);    
  }
  
  // 줄바꿈
  stack = box.addStack();
  stack.layoutHorizontally();
  
  // 공백
  for(let i = 0 ; i < firstDay ; i++) {  
    const line = stack.addStack();
    line.size = new Size(width, 0);
    line.layoutVertically();
    setText(line, ' ', userSetting.fontSize.monthly);
    stack.addSpacer(spacer);    
  }
  

  // 날짜
  for(let i = 1 ; i <= lastDate ; i++) {
    // 줄바꿈
    if((i+firstDay-1) % 7 === 0) {
      // 달력 가로 사이 줄간격
      box.addSpacer(1);

      stack = box.addStack();
      stack.layoutHorizontally();
    }
        
    const line = stack.addStack();
    line.layoutVertically();
    
    let inline = line.addStack();
    inline.size = new Size(width, width);
    inline.centerAlignContent();
    
    // 색상
    const color =
      (i+firstDay-1) % 7 === 0 ?
        userSetting.color.sunday:
        ((i+firstDay-1) % 7===6 ?
          userSetting.color.saturday : null);
        
    // 날짜
    if(i === nowDate) {
      const draw = new DrawContext();
      draw.size = new Size(width, width);
      draw.opaque = false;
      draw.respectScreenScale = true;
      draw.setFillColor(new Color(userSetting.color.today));
      draw.fillEllipse(new Rect(0, 0, width, width));

      setText(
        inline,
        i+'',
        userSetting.fontSize.monthly,
        true,
        'fff'
      );
      inline.backgroundImage = draw.getImage();
    }
    else {
      setText(
        inline,
        i+'',
        userSetting.fontSize.monthly,
        false,
        color
      );
    }

    inline = line.addStack();
    inline.size = new Size(width, 4);
    inline.centerAlignContent();

    // 일정 원 표시
    if(calendarIcon[i] !== undefined) {
      const icons = calendarIcon[i].split(",");
      for(let j = 0 ; j < icons.length && j < 2 ; j++) {
        const icon = inline.addImage(circle);
        icon.tintColor = new Color(icons[j]);
      }
    }
    
    // 세로 사이 줄 간격
    if((i+firstDay-1) % 7 < 6) stack.addSpacer(spacer);    
  }
}

/*
 * Function
 * Load data from other application or server.
 * @non-return
 *
 * From other application
 * - calendar data : from calendar application(ios).
 * - location info : from device's cellular unit.
 * From server
 * - weather data : from the National Weather Service using API.
 */
async function fetchJSONs() {
  // Calendar and reminder data.
  try {
    // For monthly calendar
    const monthStart = new Date();
    monthStart.setHours(0);
    monthStart.setDate(1);

    const monthEnd = new Date();
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(1);
    monthEnd.setHours(0);
    monthEnd.setMinutes(0);
    monthEnd.setSeconds(-1);

    thisMonthCalendar = await CalendarEvent.between(monthStart, monthEnd);
    
    // Calendar
    if(showCalendar[0]) {
      let today = new Date(), end = new Date();

      today.setHours(0)
      today.setMinutes(0)
      today.setSeconds(0)

      if(calendarPeriod === 'today') {
        calendarJSON = await CalendarEvent.today(calendarSource)
      }
      else if(calendarPeriod === 'thisMonth') {
        end.setMonth(end.getMonth() + 1);
        end.setDate(-1);
        calendarJSON = await CalendarEvent.between(
          today,
          end,
          calendarSource
        );
      }
      else if(calendarPeriod === 'thisWeek') {
        end.setDate(end.getDate() + 6 - end.getDay());
        calendarJSON = await CalendarEvent.between(
          today,
          end,
          calendarSource
        );
      }
      else {
        end.setDate(end.getDate()+parseInt(calendarPeriod));
        calendarJSON = await CalendarEvent.between(
          today,
          end,
          calendarSource
        );
      }
    }

    // Reminder
    if(showCalendar[1]) {
      reminderJSON = await Reminder.allIncomplete(reminderSource);
      reminderJSON.sort(sortReminder);
    }
  }
  catch { console.error('Error : Load calendar data') }

  // Weather data.
  let weatherURL, nx = -1, ny = -1;
  while(nx+ny < 0) {
    console.log('Loading current location data...');
    try {
      Location.setAccuracyToThreeKilometers();
      let
        location = await Location.current(),
        lat = location.latitude,
        lon = location.longitude;

      // Change current location to grid(x, y)
      let grid = changeLocationGrid(lat, lon);
      nx = grid[0];
      ny = grid[1];
    }
    catch { nx = ny = -1; }
  }

  try {
    weatherURL = await getWeatherURL(nx, ny);
    weatherJSON = await new Request(weatherURL).loadJSON();
  }
  catch {
    console.error('Error : Load weather data');
    console.error('URL : ' + weatherURL);
  }


  // Comparable for sorting reminder data.
  function sortReminder(a, b) {
    if(a.dueDate != null && b.dueDate == null) return -1
    else if(a.dueDate == null && b.dueDate != null) return 1
    else if(a.dueDate == null && b.dueDate == null) {
      return a.creationDate - b.creationDate;
    }
    else {
      if(a.dueDate === b.dueDate) {
        return a.creationDate - b.creationDate;
      }
      else return a.dueDate - b.dueDate;
    }
  }
}

/*
 * Function
 * Make battery icon.
 * @return {image} : battery icon.
 */
function getBatteryImage(batteryLevel) {
  if(Device.isCharging()) {
    return SFSymbol.named('battery.100.bolt').image;
  }

  const
    batteryWidth = 87,
    batteryHeight = 41,

    draw = new DrawContext(),
    image = SFSymbol.named("battery.0").image,
    rect = new Rect(0, 0, batteryWidth, batteryHeight),

    // Match the battery level values to the SFSymbol.
    x = batteryWidth * 0.1525,
    y = batteryHeight * 0.247,
    width = batteryWidth * 0.602,
    height = batteryHeight * 0.505;

  draw.opaque = false;
  draw.respectScreenScale = true;
  draw.size = new Size(batteryWidth, batteryHeight);
  draw.drawImageInRect(image,rect);


  // Determine the width and radius of the battery level.
  const current = width * batteryLevel;
  let radius = height / 6.5;

  // When it gets low, adjust the radius to match.
  if (current < (radius*2)) radius = current / 2;

  // Make the path for the battery level.
  let
    barPath = new Path(),
    barRect = new Rect(x, y, current, height);

  barPath.addRoundedRect(barRect, radius, radius);

  draw.addPath(barPath);
  draw.fillPath();
  return draw.getImage();
}

/*
 * Function
 * Make weather URL for API.
 * @return {string} : url of API.
 */
async function getWeatherURL(nx, ny) {
  let
    weatherURL = 'http://apis.data.go.kr/1360000/'
      + 'VilageFcstInfoService/getUltraSrtFcst?serviceKey='
      + userSetting.appKey + '&numOfRows=60&dataType=JSON&base_date=',
    date = new Date(),
    base_date, base_time;

  dateFormatter.dateFormat = 'yyyyMMddHH30';

  // Match with api's update time.
  if(date.getMinutes() < 45) date.setHours(date.getHours()-1);
  base_date = dateFormatter.string(date).substring(0, 8);
  base_time = dateFormatter.string(date).substring(8);

  // Return weather URL
  weatherURL +=
    base_date
    + '&base_time=' + base_time
    + '&nx=' + nx
    + '&ny=' + ny;
  return weatherURL;
}

/*
 * Function
 * Change from latitude and longitude to grid
 * @return {array[string, string]} : grid
 *
 * For using the National Weather Service API,
 * location must be changed to grid(x, y)
 */
function changeLocationGrid(lat, lon) {
  const
    RE = 6371.00877,
    GRID = 5.0,
    SLAT1 = 30.0,
    SLAT2 = 60.0,
    OLON = 126.0,
    OLAT = 38.0,
    XO = 43,
    YO = 136,

    DEGRAD = Math.PI / 180.0,

    re = RE / GRID,
    slat1 = SLAT1 * DEGRAD,
    slat2 = SLAT2 * DEGRAD,
    olon = OLON * DEGRAD,
    olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI*0.25 + slat2*0.5)
      / Math.tan(Math.PI*0.25 + slat1*0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI*0.25 + slat1*0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  let ro = Math.tan(Math.PI*0.25 + olat*0.5);
  ro = (re*sf) / Math.pow(ro, sn);

  const rs = [];
  let ra = Math.tan(Math.PI*0.25 + lat*DEGRAD*0.5);
  ra = (re*sf) / Math.pow(ra, sn);

  let theta = lon*DEGRAD - olon;
  if(theta > Math.PI) theta -= 2.0 * Math.PI;
  if(theta < -Math.PI) theta += 2.0 * Math.PI;

  theta *= sn;

  rs[0] = Math.floor(ra*Math.sin(theta) + XO + 0.5);
  rs[1] = Math.floor(ro - ra*Math.cos(theta) + YO + 0.5);

  return rs;
}

/*
 * Function
 * Change weather information consist of number to text.
 * @return {string} : weather status in text.
 *
 * Result of the National Weather Service API is number.
 * This should be changed to text for display.
 */
function getWeatherStatus(rain, sky) {
  const
    skyArr = ['맑음', '구름조금', '구름많음', '흐림'],
    rainArr = ['없음', '비', '비/눈', '눈', '소나기', '빗방울', '비/눈', '눈날림'];

  if(rain === 0) return skyArr[sky];
  else return rainArr[rain];
}

/*
 * Function
 * Change weather information consist of number to image.
 * @return {image} : weather status in image.
 *
 * Result of the National Weather Service API is number.
 * For display, we must make icon image from number information.
 */
function getWeatherImage(rain, sky, volume) {
  const iconArr = [
    // 공통
    'cloud.fill',            // 0. 흐림
    'cloud.heavyrain.fill',  // 1. 많은 비(비, 소나기)
    'cloud.sleet.fill',      // 2. 비/눈(빗방울/눈날림)
    'snow',                  // 3. 눈(눈날림)
                             // 아침
    'sun.max.fill',          // 4. 맑음
    'cloud.sun.fill',        // 5. 구름 조금
    'cloud.sun.fill',        // 6. 구름 많음
    'cloud.drizzle.fill',    // 7. 적은 비(비, 빗방울) + 일반
    'cloud.sun.rain.fill',   // 8. 비 + 구름 적음
                             // 저녁
    'moon.stars.fill',       // 9. 맑음
    'cloud.moon.fill',       // 10. 구름 조금
    'cloud.moon.fill',       // 11. 구름 많음
    'cloud.drizzle.fill',    // 12. 적은 비(비, 빗방울)
    'cloud.moon.rain.fill'   // 13. 비 + 구름 적음
  ]

  let iconIndex;
  if(rain === 0) { // 맑음, 구름조금, 구름많음, 흐림(공통)
    if(sky === 3) iconIndex = 0;
    else iconIndex = sky + 4;
  }
  else {
    // 눈(공통)
    if(rain === 3 || rain === 7) iconIndex = 3;
    // 비+눈(공통)
    else if(rain === 2 || rain === 6) iconIndex= 2;
    // 비
    else {
      // 비+구름적음
      if(sky < 2) iconIndex = 8;
      // 많은 비;
      else if(volume > 5) iconIndex = 1;
      // 적은 비
      else iconIndex = 7;
    }
  }

  // A icon that is changed as time. (ex: sun -> moon)
  let
    currentHour = new Date().getHours(),
    height;

  if((currentHour<7||currentHour>18) && iconIndex>3) {
    iconIndex += 5;
  }

  if(iconIndex === 1) height = 180;
  else if(iconIndex === 0 || iconIndex === 6 || iconIndex === 11) {
    height = 150;
  }
  else height = 200;

  const
    icon = SFSymbol.named(iconArr[iconIndex]).image,
    draw = new DrawContext();

  draw.size = new Size(200, height);
  draw.opaque = false
  draw.respectScreenScale = true
  draw.drawImageInRect(icon, new Rect(0, 0, 200, height));

  return draw.getImage();
}

/*
 * Function
 * Make components of calendar and reminder
 * @non-return
 */
function getCalendarContent(num, json, right, isCalendar) {
  if(right !== true) right = false

  const draw = new DrawContext()
  draw.opaque = false
  draw.respectScreenScale = true
  draw.fillEllipse(new Rect(0, 0, 200, 200))
  const circle = draw.getImage()

  dateFormatter.dateFormat = 'M'
  const thisMonth = dateFormatter.string(new Date())

  for(let i = 0 ; i < num; i++ ) {
    line = stack.addStack()
    line.layoutHorizontally()
    /*if(!showCalendarTime) */
    line.centerAlignContent()

    // Get title and bar's color from JSON file.
    title = json[i].title
    color = json[i].calendar.color.hex

    // In calendar set period
    let period = ''
    if(isCalendar && calendarPeriod !== 'today') {
      const start = json[i].startDate
      const end = json[i].endDate

      dateFormatter.dateFormat = 'M'
      const startMonth = dateFormatter.string(start)
      const endMonth = dateFormatter.string(end)

      dateFormatter.dateFormat = 'd'
      const startDate = dateFormatter.string(start)
      const endDate = dateFormatter.string(end)


      // 하루 일정
      if(startMonth === endMonth && startDate === endDate) {
        // 이번 달 일정
        if(startMonth === thisMonth) period += startDate
        // 다음 달 일정
        else period += startMonth + '/' + startDate
      }
      // 기간 일정
      else {
        // 이번 달 일정
        if(startMonth === endMonth) {
          period += startMonth + '/' + startDate
              + '-' + endDate
        }
        // 다음 달 일정
        else {
          period += startMonth + '/' + startDate
              + '-' + endMonth + '/' + endDate
        }
      }
      period += ' | '
      /*
      if(showCalendarTime) {
        // 하루 일정
        if(startMonth == endMonth && startDate == endDate) {
          dateFormatter.dateFormat = 'M/d H:mm-'
          period = dateFormatter.string(start)
          dateFormatter.dateFormat = 'H:mm'
          period += dateFormatter.string(end) + ' | '
        }
      }
      */
    }

    // Draw circle
    if(right) line.addSpacer()
    content = line.addImage(circle)
    content.imageSize = new Size(userSetting.fontSize.extraSmall-3,
        userSetting.fontSize.extraSmall-9)
    content.tintColor = new Color(color)

    // Add text
    content = setText(line, period + title,
        userSetting.fontSize.extraSmall)
    content.lineLimit = 1
    stack.addSpacer(userSetting.calendarSpacer)
  }
}

/*
 * Function
 * Make text in stack
 * @non-return
 */
function setText(stack, text, size, bold, colorHex) {
  if(bold !== true) bold = false;
  let content = stack.addText(text);

  if(userSetting.font.normal == null || userSetting.font.bold == null) {
    if(bold) content.font = Font.boldSystemFont(size);
    else content.font = Font.systemFont(size);
  }
  else {
    if(bold) content.font = new Font(userSetting.font.bold, size);
    else content.font = new Font(userSetting.font.normal, size);
  }

  // color
  if(colorHex == null) content.textColor = contentColor;
  else content.textColor = new Color(colorHex);

  return content;
}

/*
 * Function
 * Set color of background or content.
 * @params {type} : number
 * - 0 : set widget background color
 * - 1 : set content color(text or icon)
 * @params {colorNumber} : number
 * - over 0 : [black, white, yellow, green, blue]
 *
 * @non-return
 */
function setColor(type, colorNumber) {
  let color;
  if(colorNumber === 5) {
    colorNumber = Device.isUsingDarkAppearance() ? type : 1-type;
  }
  if(colorNumber === 0) color = Color.black();
  else if(colorNumber === 1) color = Color.white();
  else if(colorNumber === 2) color = Color.yellow();
  else if(colorNumber === 3) color = Color.green();
  else if(colorNumber === 4) color = Color.blue();

  if(type === 0) widget.backgroundColor = color;
  else if(type === 1) contentColor = color;
}

/*
 * Function
 * Fetch language
 * @non-return
 */
function setLocaleLanguage(locale) {
  let fetch = false;
  if(locale === 'en') {
    dateFormatter.locale = 'en';
    fetch = true;
  }
  else dateFormatter.locale = 'ko-Kore_KR';

  localeJSON.today      = !fetch ? 'y년 M월 d일 EEEE' : 'E, dd, MMM';
  localeJSON.year       = !fetch ? 'yy년'    : 'y,';
  localeJSON.day        = !fetch ? 'EEEE'    : 'E';
  localeJSON.calendar   = !fetch ? '일정'     : 'Calendar';
  localeJSON.reminder   = !fetch ? '미리알림'  : 'Reminder';

  localeJSON.sun        = !fetch ? '일' : 'S';
  localeJSON.mon        = !fetch ? '월' : 'M';
  localeJSON.tue        = !fetch ? '화' : 'T';
  localeJSON.wen        = !fetch ? '수' : 'W';
  localeJSON.thu        = !fetch ? '목' : 'T';
  localeJSON.fri        = !fetch ? '금' : 'F';
  localeJSON.sat        = !fetch ? '토' : 'S';
}

/*
 * Function
 * Set alert to show message or choices.
 * @return {number} : result of alert that user choose.
 */
async function setAlert(content, title, message) {
  let alert = new Alert();
  if(title != null) alert.title = title;
  if(message != null) alert.message = message;
  for(let i of content) alert.addAction(i);
  return await alert.present();
}

/*
 * Function
 * Load setting file from disk and reflect the setting.
 * If there is no setting file on disk, download setting script from server and run it.
 * @non-return
 */
async function setWidgetAttribute() {
  // 설정 스크립트 설치 여부 및 설정 파일 존재 여부 확인
  fetchSettingScript();
  if(!localFM.fileExists(path+'settingJSON')) {
    return fetchSettingScript(true);
  }

  // Load settingJSON file.
  settingJSON = JSON.parse(localFM.readString(path+'settingJSON'));
  console.log('설정 파일을 로드 성공');

  if(settingJSON.backgroundType === 'invisible' &&
      !localFM.fileExists(path+'backgroundImage')) {
    await setAlert(
      ['확인'],
      '투명 배경 설정',
      '투명 설정이 정상적으로 진행되지 않았습니다. 설정을 다시 진행합니다.'
    );

    const scriptPath = iCloud.joinPath(iCloudDirectory, 'Gofo_투명 위젯 설정');
    if(iCloud.fileExists(scriptPath)) {
      await WebView.loadURL('scriptable:///run/' + encodeURI('Gofo_투명 위젯 설정'));
    }
    else fetchSettingScript(true);

    return settingModule.invisibleWidget();
  }

  setColor(1, Number(settingJSON.contentColor));
  setLocaleLanguage(settingJSON.locale);
  VIEW_MODE = Number(settingJSON.widgetSize);
  const backgroundType = settingJSON.backgroundType;

  if((backgroundType + VIEW_MODE).indexOf('undefined') >= 0) {
    return fetchSettingScript(true);
  }

  if(VIEW_MODE === 2) {
    let
      array = settingJSON.largeWidgetSetting.split(','),
      calendarList = settingJSON.calendarSource.split(','),
      reminderList = settingJSON.reminderSource.split(',');

    showCalendar[0] = array[0] === 'true';
    showCalendar[1] = array[1] === 'true';
    showCalendar[2] = array[2] === 'true';
    isCalendarRight = settingJSON.isCalendarRight === 'true';

    if(showCalendar[0]) {
      calendarPeriod = settingJSON.calendarPeriod;
      showCalendarTime = settingJSON.showCalendarTime === 'true';
      try {
        for (let i of calendarList) {
          calendarSource.push(await Calendar.forEventsByTitle(i));
        }
      }
      catch {
        await setAlert(
          ['확인'],
          '캘린더 지정',
          '캘린더가 올바르게 지정되지 않았습니다. 다시 지정해주세요.'
        );

        fetchSettingScript(true);
      }
    }

    if(showCalendar[1]) {
      try {
        for (let i of reminderList) {
          reminderSource.push(await Calendar.forRemindersByTitle(i))
        }
      }
      catch {
        await setAlert(
          ['확인'],
          '리마인더 지정',
          '리마인더가 올바르게 지정되지 않았습니다. 다시 지정해주세요.'
        );

        fetchSettingScript(true);
      }
    }
  }
  else {
    let calendarList = settingJSON.calendarSource.split(',');
    try {
      for (let i of calendarList) {
        calendarSource.push(await Calendar.forEventsByTitle(i));
      }
    }
    catch {
      await setAlert(
        ['확인'],
        '캘린더 지정',
        '캘린더가 올바르게 지정되지 않았습니다. 다시 지정해주세요.'
      );

      fetchSettingScript(true);
    } 
  }

  if(backgroundType === 'bookmark') {
    widget.backgroundImage = await localFM.readImage(settingJSON.bookmark);
  }
  else if(backgroundType === 'background') {
    widget.backgroundImage = await localFM.readImage(path + 'backgroundImage');
  }
  else if(backgroundType === 'color') {
    setColor(0, Number(settingJSON.backgroundColorNumber));
  }
  else if(backgroundType === 'invisible') {
    settingJSON.backgroundType = 'background';
    widget.backgroundImage = await localFM.readImage(path + 'backgroundImage');
    
    localFM.writeString(path+'settingJSON', JSON.stringify(settingJSON));

    const filePath = iCloud.joinPath(iCloudDirectory, 'Gofo_투명 위젯 설정.js');
    if(iCloud.fileExists(filePath)) iCloud.remove(filePath);
  }


  async function fetchSettingScript(run) {
    const
      url = 'https://raw.githubusercontent.com/sunung007/Scriptable_Calendar/main/setting.js',
      filePath = iCloud.joinPath(iCloud.documentsDirectory(), 'Gofo_달력 위젯 설정.js');

    if(!iCloud.fileExists(filePath)) {
      const request = await new Request(url).loadString();
      console.log('Save setting script.');
      iCloud.writeString(filePath, request);
      run = true;
    }

    if(run) {
      await WebView.loadURL('scriptable:///run/' + encodeURI('Gofo_달력 위젯 설정'));
    }
  }
}
