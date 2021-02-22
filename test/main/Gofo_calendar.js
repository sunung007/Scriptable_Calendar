// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
let contentColor = Color.white() // test code.

let sizeSmall = 10
let sizeMedium = 12 // test code.
let sizeMonthly = 10
const colorIncrease = 'F51673'
const colorDecrease = '2B69F0'
const colorGray = '545454'
const colorSun = colorIncrease
const colorSat = colorDecrease

const appKey = 'e8AFfWnF9M5a355DPc9CSmzWHBW5JhXMfqg7vsEVIcqr9ZaS70Ahr%2FETSdFC1o5TUybHaANphNqbJR0aeZj6dA%3D%3D'


const widget = new ListWidget()

const localFM = FileManager.local()
const localPath = localFM.joinPath(
                  localFM.documentsDirectory(),
                  'Gofo-calendar-')
const fcstPath = localFM.joinPath(
                           localFM.documentsDirectory(),
                           'Gofo-Fcst-info')
const ultraFcstPath = localFM.joinPath(
                           localFM.documentsDirectory(),
                           'Gofo-Ultra-Fcst-info')        

let dateFormatter = new DateFormatter()
let fcstJSON = {}
let ultraFcstJSON = {}
let pmJSON = {}
let step1, step2

let fcstChange, ultraFcstChange
let container, box, stack

// [Calendar, Reminder]
let showCalendar = [true, true]
let calendarJSON = {}
let reminderJSON = {}


await fetchInfos()

createWidget()

widget.setPadding(10,10,10,10)
widget.presentLarge()
Script.setWidget(widget)
Script.complete()


// Create widget
function createWidget() {
  container = widget.addStack()
  container.layoutVertically()
  box = container.addStack()
  box.layoutHorizontally()
/*  
  setWeatherWidget()
  stack.addSpacer()
  setPmWidget()
  
  container.addSpacer(10)
  
  box = container.addStack()*/
  setMonthlyDateWidget()
//  setCalendarWidget()
  container.addSpacer()
}

// Show monthly calendar when user choose option.
function setMonthlyDateWidget() {
 /* const days = [localeJSON.sun, localeJSON.mon, localeJSON.tue,
                localeJSON.wen, localeJSON.thu, localeJSON.fri,
                localeJSON.sat]*/
  const days = ['일','월','화','수','목','금','토']
  const width = sizeMonthly * 1.7
  const height = sizeMonthly * 1
  let line, content
  
  box = container.addStack()
  stack = box.addStack()
  stack.layoutVertically()
  stack.url = 'calshow://'

  // month
  const date = new Date()
  dateFormatter.dateFormat = 'MMM'
  addText(stack, dateFormatter.string(date), sizeSmall, true)

  // dates
  let nowDate, firstDay, lastDate
  nowDate = date.getDate()  // today's date
  date.setDate(1)
  firstDay = date.getDay()  // 1st day in this month
  date.setMonth(date.getMonth()+1)
  date.setDate(0)
  lastDate = date.getDate() // last day in this month
  
  // set arrays
//  const lineNum = Math.ceil((firstDay+lastDate)/7.0)
  const matrix = [new Array(lastDate+firstDay), 
                  new Array(lastDate+firstDay), 
                  new Array(lastDate+firstDay)]

  line = stack.addStack()
  line.layoutHorizontally()

  let row = 0
  for(let j = 0 ; row!=3 || j!=lastDate+firstDay-1 ; j++) {
//    console.log(row + ', ' + j)
    matrix[row][j] = line.addStack()
    matrix[row][j].size = new Size(width,0)
    if(j%7 == 6) {
      if(row < 2) {
        j -= 7
        row++
      }
      else if(row == 2) row = 0
      line = stack.addStack()
    }
    if(j==lastDate+firstDay-1) {
      row++
      j--
    }
  }
  
  for(let i = 1 ; i <= lastDate ; i++) {
    addText(matrix[0][i+firstDay-1], i+'', sizeMonthly)
  }
  /*
  // draw bar and circle.
  dateFormatter.dateFormat = 'MMdd'
  let thisMonth = new Date().getMonth()+1
  for(let i in calendarJSON) {
    let start = dateFormatter.string(calendarJSON[i].startDate)
    let end = dateFormatter.string(calendarJSON[i].endDate)
    
    let startMonth = Number(start.substring(0,2))
    let startDate = Number(start.substring(2))
    
    let endMonth = Number(end.substring(0,2))
    let endDate = Number(end.substring(2))

    if(startDate==endDate && thisMonth==startMonth) {
      content = matrix[1][startDate+firstDay-1].addStack()
      content.setPadding(0,1.3,0,1.3)
      context = content.addImage(drawIcon(0))
      context.tintColor = new Color(calendarJSON[i].
                                    calendar.color.hex)
      context.imageSize = new Size(3, 3)
    }
    else if(startDate != endDate) {
      let color = calendarJSON[i].calendar.color.hex
      if(startMonth==thisMonth && endMonth==thisMonth) {
        drawBar(startDate, endDate, color)
      }
      else if(startMonth==thisMonth && endMonth!=thisMonth) {
        drawBar(startDate, lastDate, color)
      }
      else if(startMonth!=thisMonth && endMonth==thisMonth) {
        drawBar(1, endDate, color)
      }
      else if(startMonth!=thisMonth && endMonth!=thisMonth) {
        drawBar(1, lastDate, color)
      }
    }
  }*/
  
  function drawBar(start, end, color) {
    for(let i = start ; i <= end ; i++) {
      matrix[2][i+firstDay-1].layoutVertically()
      let context = matrix[2][i+firstDay-1].addImage(drawIcon(1))
      context.tintColor = new Color(color)
      context.imageSize = new Size(width, 3)
    }
  }
  
  function drawIcon(type) {
    let drawWidth = type==0 ? 300 : 100*width
    const drawHeight = 300
    const draw = new DrawContext()
    const rect = new Rect(0,0,drawWidth, drawHeight)
    draw.opaque = false
    draw.respectScreenScale = true
    draw.size = new Size(drawWidth, drawHeight)
    
    if(type == 0) {
      draw.fillEllipse(rect)
    }
    else if(type == 1) {
      draw.fill(rect)
    }
    return draw.getImage()
  }
  
}



// Make calendar widget shown in large size.
function setCalendarWidget() {
  let title, color
  let line, content
  let maxNum = 3 // max number of line each has

  // default : do not show
  let calendarNum = -1
  let reminderNum = -1

  // 0 : calendar / 1 : reminder / 2 : monthly date
  if(!showCalendar[0] || !showCalendar[1]) maxNum = 6
  if(showCalendar[0]) {
    calendarNum = calendarJSON.length > maxNum
                  ? maxNum : calendarJSON.length
  }
  if(showCalendar[1]) {
    reminderNum = reminderJSON.length > maxNum
                  ? maxNum : reminderJSON.length
  }

  box = container.addStack()
  box.layoutVertically()
  stack = box.addStack()
  stack.layoutVertically()

  // Show calendar
  if(showCalendar[0]) {
    stack.url = 'calshow://'
    line = stack.addStack()
    
//    if(isCalendarRight) line.addSpacer()
//    addText(line, localeJSON.calendar,fontSizeSmall, true)

    addText(line, 'Calendar', sizeSmall, true)

    if(calendarNum == 0) {
      addText(line, ' 0', sizeSmall, true)//, colorGray)
    }
    else {
      if(calendarJSON.length > calendarNum) {
        let text = ' +' + (calendarJSON.length-calendarNum)
        addText(line, text, sizeSmall, true)//, colorGray)
      }
      getCalendarContent(calendarNum, calendarJSON,
                         isCalendarRight, true)
    }
  }
/*
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
    setText(line.addText(localeJSON.reminder),fontSizeSmall, true)
    if(reminderNum == 0) {
      setText(line.addText('0'), fontSizeSmall, true, colorGray)
    }
    else {
      if(reminderJSON.length > reminderNum) {
        content = line.addText(' +'+(reminderJSON.length
                                    -reminderNum))
        setText(content, fontSizeSmall, true, colorGray)
      }
      getCalendarContent(reminderNum, reminderJSON,
                         isCalendarRight, false)
    }
  }
  */
}


function setWeatherWidget() {
  let temp, rain, sky, volume
  let maxTemp, minTemp
  let response, errorCode
  
  try {
    console.log('Load new fcst data')
    response = fcstJSON.response
    if(response == null) { throw error }
    // error
    errorCode = response.header.resultCode
    if(errorCode != '00') {
      console.error('Fcst : '+response.header.resultMsg)
      return
    }
  }
  catch {
    console.error('Error : fcst API')
    return
  }
      
  // Extract weather data from JSON file.
  let weatherItems = response.body.items.item
  let fcstDate = fcstJSON.base_date
  for(let i in weatherItems) {
    if(weatherItems[i].fcstDate == fcstDate) {
      let category = weatherItems[i].category
      if(category == 'TMN') {
        minTemp = weatherItems[i].fcstValue
      }
      else if(category == 'TMX') {
        maxTemp = weatherItems[i].fcstValue
      }
    }
  }

  minTemp = Number(minTemp).toFixed() + '℃'
  maxTemp = Number(maxTemp).toFixed() + '℃' 
  
  // Ultra fcst information.
  try {
    response = ultraFcstJSON.response
    if(response == null) { throw error }
    errorCode = response.header.resultCode
    if(errorCode != '00') {
      console.error('UltraFcst : '+response.header.resultMsg)
      return
    }
  }
  catch {
    console.error('Error : Ultra Fcst API')
    return
  }
    
  // Extract weather data from JSON file.
  weatherItems = response.body.items.item
  let fcstTime = weatherItems[0].fcstTime
  for(let i in weatherItems) {
  if(weatherItems[i].fcstTime == fcstTime) {
    let category = weatherItems[i].category
      if(category == 'T1H') {
        temp = weatherItems[i].fcstValue+'℃'
      }
      else if(category == 'SKY') {
        sky = Number(weatherItems[i].fcstValue) -1
      }
      else if(category == 'PTY') {
        rain = weatherItems[i].fcstValue
      }
      else if(category == 'RN1') {
        volume = weatherItems[i].fcstValue
      }
    }
  }
  
  // Make widget
  let content
    
  stack = box.addStack()
  stack.layoutHorizontally()
  stack.centerAlignContent()
  
  let img = getWeatherImage(rain, sky, volume)
  content = stack.addImage(img)
  content.imageSize = new Size(sizeSmall+4, sizeSmall+4)
  content.tintColor = contentColor
  stack.addSpacer(5)
  
  addText(stack, temp, sizeSmall, true)
  stack.addSpacer(12)
  // Lowest temperature
  addText(stack, '최저 ', sizeSmall)
  addText(stack, minTemp, sizeSmall, false, colorDecrease)
  stack.addSpacer(8)
  // Highest temperature
  addText(stack, '최고 ', sizeSmall)
  addText(stack, maxTemp, sizeSmall, false, colorIncrease)  
}


function setPmWidget() {
  const items = pmJSON.list
  const grades = ['좋음', '보통', '나쁨', '매우나쁨']
  let pm10, pm25 // 1:좋음 2:보통 3:나쁨 4:매우나쁨
  let pm10Grade, pm25Grade
  
  for(let i in items) {
    if(items[i].mangName == '도시대기' &&
       step2.indexOf(items[i].stationName) >= 0){
      pm10 = items[i].pm10Grade1h
      pm25 = items[i].pm25Grade1h
    }
  }
  
  if(pm10 == null || pm25 == null) {
    pm10 = items[0].pm10Grade1h
    pm25 = items[0].pm25Grade1h
  }
  
  pm10Grade = grades[pm10-1]
  pm25Grade = grades[pm25-1]
  
  let draw = new DrawContext()
  draw.opaque = false
  draw.respectScreenScale = true
  draw.drawImageInRect(SFSymbol.named('wind').image,
                       new Rect(0,0,220,200))
                      
  let context
  stack = box.addStack()
  stack.layoutHorizontally()
  stack.centerAlignContent()
  
  addText(stack, '미세먼지 ', sizeSmall, false)
  addText(stack, pm10Grade, sizeMedium, true)
  stack.addSpacer(5)
  addText(stack, '초미세먼지 ', sizeSmall, false)
  addText(stack, pm25Grade, sizeMedium, true)
  //context = stack.addImage(draw.getImage())
  //context.imageSize = new Size(sizeMedium+4, sizeMedium+4)
  
}


function addText(stack, text, size, bold, colorHex) {
  let content = stack.addText(text)
  content.testSize = size
  
  try {
    if(font == null) throw error
    try {
      if(bold) content.font = new Font(boldFont, size)
      else content.font = new Font(font, size)
    }
    catch { throw error }
  }
  catch {
    // bold and size
    if(bold) content.font = Font.boldSystemFont(size)
    else content.font = Font.systemFont(size)
  }

  // color
  if(colorHex == null) content.textColor = contentColor
  else content.textColor = new Color(colorHex)
  
}


async function fetchInfos() {/*
  // Load setting file ========================================
  const iCloudFM = FileManager.iCloud()
  const settingScriptPath = iCloudFM.joinPath(
                            iCloudFM.documentsDirectory(),
                            'Gofo_캘린더 위젯 설정.js')
  if(iCloudFM.fileExists(settingScriptPath)) {
    console.log('설정 스크립트에서 설정값을 로드합니다.')
    //let settingURL = 'scriptable:///run/Gofo_캘린더 위젯 설정'
  }
  else {
    console.log('설정 스크립트가 없습니다. 새로 로드합니다.')
    //let settingURL = ''
    //let request = await new Request(settingURL).loadString()
  }


  // Weather data =============================================  
  // Check loction.
  // Get current location and change it to grid.
  // For speed, down accuracy of location.
  console.log('현재 위치 로드')
  Location.setAccuracyToThreeKilometers()
  const location = await Location.current()
  const lat = location.latitude
  const lon = location.longitude
  const grid = changeLocationGrid(lat, lon)

  let fcstURL, ultraFcstURL
  try {
    console.log('날씨 정보 로드')
    fcstURL = getWeatherURL('fcst',grid)
    ultraFcstURL = getWeatherURL('ultraFcst',grid)
    
    fcstJSON = await new Request(fcstURL).loadJSON()
    ultraFcstJSON = await new Request(ultraFcstURL).loadJSON()
  }
  catch {
    console.error('Error : fetch weather data from server.')
    console.error(fcstURL)
    console.error(ultraFcstURL)
  }
  
  
  // PM 10, PM 2.5 =============================================
  let pmURL = await getPmURL(grid[0], grid[1])
  try {
    pmJSON = await new Request(pmURL).loadJSON()
    console.log('대기정보 로드')
  }
  catch {
    console.error('Error : Fetch pm data from server')
    console.error(step1 + ' ' + step2)
    console.error(pmURL)
  }  
  */
  
  // Calendar ==================================================
  if(showCalendar[0]) {
    let start = new Date()
    let end = new Date()
    start.setDate(1)
    end.setDate(0)
    end.setMonth(end.getMonth()+1)
    calendarJSON = await CalendarEvent.between(start, end)
  }
  
  // Reminder ==================================================
  if(showCalendar[1]) {
    reminderJSON = await Reminder.allIncomplete()
    reminderJSON.sort(sortReminder)
  }
}

async function getPmURL(nx, ny) {
  let cityUrl = 'https://raw.githubusercontent.com/sunung007/IosScriptable/main/Calendar/gridToCity.json'
  let cityJSON = await new Request(cityUrl).loadString()

  cityJSON = JSON.parse(cityJSON)
  
  for(let i in cityJSON) {
    if(cityJSON[i].x == nx && cityJSON[i].y == ny) {
      step1 = cityJSON[i].step1
      step2 = cityJSON[i].step2
      break
    }
  }

  let pmUrl = 'http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?'
  pmUrl += 'ServiceKey=' + appKey
           + '&numOfRows=50'
           + '&sidoName=' + encodeURI(step1)
           + '&ver=1.3'
           + '&_returnType=json'
  return pmUrl
}

function getBaseTime(method) {
  let date = new Date()
  let base_date, base_time

  if(method == 'fcst') {
    dateFormatter.dateFormat = 'HHmm'
    let current = Number(dateFormatter.string(date))
    if(current < Number(0200)) { date.setDate(date.getDate()-1) }
    base_time = '0200'
    dateFormatter.dateFormat = 'yyyyMMdd'
    base_date = dateFormatter.string(date)
  }
  else {
    if(date.getMinutes() < 45) {
      date.setHours(date.getHours()-1)
    }
    dateFormatter.dateFormat = 'yyyyMMddHH30'
    base_date = dateFormatter.string(date).substring(0, 8)
    base_time = dateFormatter.string(date).substring(8)
  }
  
  return [base_date, base_time]  
}

// Functions about weather -----------------------------------
// Function : Make and return weather request url.
function getWeatherURL(method, grid) {
  let url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService/'
  let base = getBaseTime(method)

  // Return weather URL
  url += ((method=='fcst') ? 'getVilageFcst':'getUltraSrtFcst')
         + '?serviceKey=' + appKey
         + '&numOfRows=' + ((method=='fcst') ? '150':'60')
         + '&dataType=JSON'
         + '&base_date=' + base[0] + '&base_time=' + base[1]
         + '&nx=' + grid[0] + '&ny=' + grid[1]
        
  return url
}

// Function : Change latitude and longitude -> grid(x, y)
function changeLocationGrid(lat, lon) {
  const RE = 6371.00877
  const GRID = 5.0
  const SLAT1 = 30.0
  const SLAT2 = 60.0
  const OLON = 126.0
  const OLAT = 38.0
  const XO = 43
  const YO = 136

  const DEGRAD = Math.PI / 180.0
  const RADDEG = 180.0 / Math.PI

  const re = RE / GRID
  const slat1 = SLAT1 * DEGRAD
  const slat2 = SLAT2 * DEGRAD
  const olon = OLON * DEGRAD
  const olat = OLAT * DEGRAD

  let sn = Math.tan(Math.PI*0.25 + slat2*0.5)
           / Math.tan(Math.PI*0.25 + slat1*0.5)
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)
  let sf = Math.tan(Math.PI*0.25 + slat1*0.5)
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn
  let ro = Math.tan(Math.PI*0.25 + olat*0.5)
  ro = (re*sf) / Math.pow(ro, sn)

  const rs = []
  let ra = Math.tan(Math.PI*0.25 + lat*DEGRAD*0.5)
  ra = (re*sf) / Math.pow(ra, sn)
  let theta = lon*DEGRAD - olon
  if(theta > Math.PI) theta -= 2.0 * Math.PI
  if(theta < -Math.PI) theta += 2.0 * Math.PI
  theta *= sn
  rs[0] = Math.floor(ra*Math.sin(theta) + XO + 0.5)
  rs[1] = Math.floor(ro - ra*Math.cos(theta) + YO + 0.5)

  return rs
}

function getWeatherStatus(rain, sky) {
  const skyArr = ['맑음', '구름조금', '구름많음', '흐림']
  const rainArr = ['없음', '비', '비/눈', '눈', '소나기', '빗방울',
                   '비/눈', '눈날림']
  if(rain == 0) return skyArr[sky]
  else return rainArr[rain]
}

function getWeatherImage(rain, sky, volume) {
  const iconArr = [
    // 공통
    // 0.흐림, 1.많은비(비,소나기), 2.비/눈(빗방울/눈날림), 3.눈(눈날림)
    'cloud.fill', 'cloud.heavyrain.fill',
    'cloud.sleet.fill', 'snow',
    // 아침
    // 4.맑음 5.구름조금 6.구름많음 7.적은비(비,빗방울)+일반 8.비+구름적음
    'sun.max.fill', null, 'cloud.sun.fill', 'cloud.drizzle.fill',
    'cloud.sun.rain.fill',
    // 저녁
    // 9.맑음 10.구름조금 11.구름많음 12.적은비(비,빗방울)+일반 13.비+구름적음
    'moon.stars.fill', null, 'cloud.moon.fill',
    'cloud.drizzle.fill', 'cloud.moon.rain.fill'
  ]
  let iconIndex

  if(rain == 0) { // 맑음, 구름조금, 구름많음, 흐림(공통)
    if(sky == 3) iconIndex = 0
    else iconIndex = sky + 4
  }
  else {
    if(rain == 3 || rain == 7) { iconIndex = 3 } // 눈(공통)
    else if(rain == 2 || rain == 6) { iconIndex = 2 } // 비+눈(공통)
    else { // 비
      if(sky < 2) { iconIndex = 8 } // 비+구름적음
      else if(volume > 5) { iconIndex = 1 } // 많은 비
      else { iconIndex = 7 }// 적은 비
    }
  }

  // A icon that is changed as time. (ex: sun -> moon)
  let date = new Date()
  let currentHour = date.getHours()
  if((currentHour<7||currentHour>18) && iconIndex>3) {
    iconIndex += 5
  }

  let height
  if(iconIndex == 1) { height = 180 }
  else if(iconIndex == 0 || iconIndex == 6 || iconIndex == 11) {
    height = 150
  }
  else height = 200

  let icon = SFSymbol.named(iconArr[iconIndex]).image
  let draw = new DrawContext()
  draw.opaque = false
  draw.respectScreenScale = true
  draw.drawImageInRect(icon, new Rect(0, 0, 200, height))
  draw.setFillColor(Color.black())

  return draw.getImage()
}

// Function : Sort reminder content for date -----------------
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
