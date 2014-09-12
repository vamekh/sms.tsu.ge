possibleScheduleIdCases = [	"ctl00_ContentPlaceHolder1_GridView2", "ctl00_C1_GridView2"	];
scheduleId = findScheduleIdInDom(possibleScheduleIdCases);


schedule = $("#" + scheduleId + " > tbody > tr ");
properties = ["", "weekDay", "place", "startTime", "endTime"]; //gakvetilis maxasiateblebi
emptyValues = ["", "--------", "კორ:-----------, სართ:0, აუდიტ:----------", "00:00"]; 
lessonTypes = schedule[0].innerText.split("\t");
weekdays = ['', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა'];

doExtensionJob(schedule);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponce){
	if(request.show == "change"){
		if($("#chex-schedule-id").css("display") == "table-row"){
			showOld();
		}else{
			var itemWidth = $(".chex-day-schedule");
			var tblWidth = itemWidth.length * (itemWidth.outerWidth()+10)+ 1;
			showNew(tblWidth);
		}
	}
})

//2014-2015 სასწავლო წლის დასაწყისში შეიცვალა ეს სახელი და ამიტომ 2ვე დავტოვე
function findScheduleIdInDom(possibleCases){
	for(var i in possibleCases){
		if($("#" + possibleCases[i] + " > tbody > tr ").length > 0){
			return possibleCases[i];
		} 
	}
}


function doExtensionJob(table){
 	
 	//დაშლიც ცხრილს მეცადინეობების მასივად
	var lessons = getLessonsArray(table);
	//დაასორტირებს მეცადინეობის დაწყების დროის მიხედვით.
	lessons = lessons.sort(function(a, b){
		return (a.startTime > b.startTime) ? 1 : (a.startTime < b.startTime)? -1:0;
	});
	
	//დააჯგუფებს კვირის დღეების მიხედვით
	var finalSchedule = groupByWeekdays(lessons);
	
	var busyDaysCount = finalSchedule.length;	
	var replaceWith = scheduleHtml(finalSchedule);	
	injectStyle(getCorStyleFile(busyDaysCount));
	
	$("#" + scheduleId).css("border", "none");
 	
 	//დამალავს ძველ ცხრილს
 	$("#" + scheduleId).closest("tr").hide();
 	//სამაგიეროდ გამოაჩენს ახალს
 	$("#" + scheduleId).closest("tr").after(replaceWith);
 	
 	
}

//დააბრუნებს მთლიანი ცხრილის ობიექტს
function getLessonsArray(table){
	var lessons = [];
	for(var i = 1; i<table.length; i++){
		lessons = lessons.concat(splitSubject(table[i]));
	}
	//console.log(lessons);
	return lessons;
}

//დაშლის საგანს მეცადინეობებად
function splitSubject(subject){
	subject = subject.innerText;
	var lessons = [];

	//მთელი ინფო საგნის შესახებ
	var data = subject.split("\n");
	
	//საგნის სახელი
	var subjectName = data[0].substring(0, data[0].length-1);
	
	//ყოველი გაკვეთილისთვის
	for(var i=1; i<data.length - 1; ){
		//შეიქმნას გაკვეთილის ახლაი ობიექტი
		var lesson = {};
		//განესაზღვროს საგნის სახელი
		lesson['subjectName'] = subjectName;
		//განისაზღვრება გაკვეთილის ტიპი (ლექცია, ლაბი...)
		lesson.lessonType = lessonTypes[Math.ceil(i/4)];
		//განისაზღვრება დეტალური ინფორმაცია
		for(var j=1; j<5; j++){
			lesson[""+properties[j]] = getLessonPropertyVariable(data[i]);
			i++;
		}
		//თუ ამ საგნისთვის განსაზღვრულია ამ ტიპის მეცადინეობა
		if(!lessonIsEmpty(lesson)){
			lessons.push(lesson);
		}
	}
	return lessons;
}

function getLessonPropertyVariable(data){
	index = data.indexOf(":");
	if(index == -1 || index > data.length - 2){
		//თუ ცვლადის მნიშვნელობა არ არის მითითებული
		return "";
	}else{
		value = data.substring(index+2);
		if(emptyValues.indexOf(value) > -1){
			//თუ ცვლადის მნიშვნელობა მითითებულია მაგრამ არაფერს არ ნიშნავს
			return "";
		}else{
			//თუ ცვლადის მნიშვნელობა მითითებულია
			return value;
		}
	}
}

function getWeekDayNumber(weekDay){
	switch (weekDay){
		case 'ორშაბათი': return 1;
		case 'სამშაბათი': return 2;
		case 'ოთხშაბათი': return 3;
		case 'ხუთშაბათი': return 4;
		case 'პარასკევი': return 5;
		case 'შაბათი': return 6;
		case 'კვირა': return 7;
		//default: return 0;
	}
	return 0;
}

//განსაზღვრულია თუ არა ასეთი მეცადინეობა.
function lessonIsEmpty(lesson){
	if(!lesson.startTime || !lesson.weekDay){
		return true;
	} 
	return false;
}

function groupByWeekdays(sortedLessons){
	//ამ მასივში შეინახება ყოველი კვირის დღის ცხრილი
	var sortedByWeekDays = [[],[],[],[],[],[],[],[]];
	//ამ მასივში შეინახება კვირის დაკავებული დღეების ცხრილი
	var onlyBusyDaysSchedule = [];
	
	for(var index in sortedLessons){
		//ჩატენის გაკვეთილს შესაბამისი კვირის დღის შესაბამის ელემენტში sortedByWeekDays-მასივიდან
		sortedByWeekDays[getWeekDayNumber(sortedLessons[index].weekDay)].push(sortedLessons[index]);
	}
	for(var i=0; i<sortedByWeekDays.length; i++){
		if(sortedByWeekDays[i].length !== 0){
			//ის ელემენტები, რომლებიც შევსებულია რამე საგნით ჩავტენოთ onlyBusyDaysSchedule-ში.
			onlyBusyDaysSchedule.push(sortedByWeekDays[i]);
		}
	}
	return onlyBusyDaysSchedule;
}


function scheduleHtml(wholeSchedule){
	html = '';
	html += '<tr id="chex-schedule-id" class="chex-table">';
	for(var i=0; i<wholeSchedule.length; i++){
		if(wholeSchedule[i].length > 0){
			html += weekdayHtml(wholeSchedule[i]);
		}
	}
	html += '</tr>';
	return html;
}

function weekdayHtml(daySchedule){
	var html = '';
	html += '<td class="chex-day-schedule">'+
				'<div class="chex-day-header">' + daySchedule[0].weekDay + '</div>'+
				'<div class="chex-lessons">';
	
	//ამ ცვლადში ინახება იმ გაკვეთილების ინდექსები, რომლებიც ემთხვევა რომელიმა სხვა გაკვეთილს
	var matches = getMatchTimeIndexes(daySchedule);
	
	for(var i = 0; i<daySchedule.length; i++){
		//თუ ემთხვევა რამეს
		if(matches.indexOf(i)>-1){
			html += lessonHtml(daySchedule[i], true);
		}else{
			html += lessonHtml(daySchedule[i], false);
		}
	}
	
	html += 	'</div>'+
			'</td>';
	return html;
}

function lessonHtml(lesson, matches){
	var html = '';
	//LARGE
	//var style = matches ? 'style="width:235px; border-right: 6px solid red; "' : '';
	//SMALL
	var corClass = matches ? 'chex-lesson-matched' : 'chex-lesson';
	html += '<div class="'+ corClass +'" title="' + lesson.subjectName + '">'+
				'<div class="chex-lesson-info">'+
					'<div class="chex-lesson-info-time">'+ lesson.startTime + '-' + lesson.endTime + '</div>'+
					'<div class="chex-lesson-info-type">'+ lesson.lessonType + '</div>'+
				'</div>'+
				'<div class="chex-lesson-subject">' + lesson.subjectName + '</div>'+
				'<div class="chex-lesson-place">' + lesson.place + '</div>'+
			'</div>';
	return html;
}

function getMatchTimeIndexes(daySchedule, index){
	var result = [];
	for(var i=0; i<daySchedule.length-1; i++){
		for(var j=i+1; j<daySchedule.length; j++){
			//თუ i-ური გაკვეთილი დროში ემთხვევა j-ურ გაკვეთილს
			if(daySchedule[i].endTime > daySchedule[j].startTime){
				result.push(i);
				result.push(j);
			}
		}
	}
	return result;
}

function getCorStyleFile(days){
	var cssSmall, cssMedium, cssLarge;
	var cssSmall = 
		'.chex-day-schedule{			margin-right: 7px;	width: 200px;	border: 1px solid gray;}'+
		'.chex-day-schedule:last-child{	margin-right: 0px;}'+
		'.chex-day-header{				font-size: 20px;	padding: 10px;}'+
		'.chex-lesson{					height: 57px;	width: 192px;	padding-left: 4px;	padding-right: 4px;}'+
		'.chex-lesson-matched{			height: 57px;	width:188px; border-right: 4px solid red; padding-left: 4px;padding-right: 4px;}'+
		'.chex-lesson-info{				font-size: 12px;	height: 15px;}'+
		'.chex-lesson-info-type{		max-width: 175px;}'+
		'.chex-lesson-subject{			height: 29px;	font-size: 13px;	line-height: 14px;}'+
		'.chex-lesson-place{			height: 11px;	font-size: 11px;}';
	
	cssLarge = 
		'.chex-day-schedule{			margin-right: 10px;	width: 250px;	border: 2px solid gray;}'+
		'.chex-day-schedule:last-child{	margin-right: 0px;}'+
		'.chex-day-header{				font-size: 20px;	padding: 10px;}'+
		'.chex-lesson{					height: 70px;	width: 240px;	padding-left: 5px;	padding-right: 5px;}'+
		'.chex-lesson-matched{ 			width:235px; padding-right: 4px; padding-left: 5px; border-right: 6px solid red;}'+
		'.chex-lesson-info{				font-size: 12px;	height: 15px;}'+
		'.chex-lesson-info-type{		max-width: 175px;}'+
		'.chex-lesson-subject{			height: 38px;}'+
		'.chex-lesson-place{			height: 16px;	font-size: 12px;}';
	
	switch(days){
		case 1:		
		case 2:		
		case 3:		
		case 4:		return cssLarge;
		case 5:		//return cssMedium;
		default:	return cssSmall;
	}
}




function injectStyle(css){

	var style = document.createElement('style');
	style.type = 'text/css';

	if (style.styleSheet) { // IE
   		style.styleSheet.cssText = css;
	} else {
		style.appendChild(document.createTextNode(css));
	}

	document.getElementsByTagName('head')[0].appendChild(style);
}

function showOld(){
	$(".chex-day-schedule").closest("table").css("width", "");
	$("#chex-schedule-id").hide();
	$("#" + scheduleId).closest("tr").show();
}

function showNew(newWidth){
	$(".chex-day-schedule").closest("table").css("width", newWidth);
	$("#" + scheduleId).closest("tr").hide();
	$("#chex-schedule-id").show();
}










































