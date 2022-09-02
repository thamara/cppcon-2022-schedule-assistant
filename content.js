function formatDay(dayStr) {
    const match = {
        'Sunday 11th September': '2022-09-11',
        'Monday 12th September': '2022-09-12',
        'Tuesday 13th September': '2022-09-13',
        'Wednesday 14th September': '2022-09-14',
        'Thursday 15th September': '2022-09-15',
        'Friday 16th September': '2022-09-16',
    }
    return match[dayStr];
}

function getDetails(e) {
    let id = '';
    let link = '';
    let title = '';
    let type = '';
    let presenter = '';
    let startTime = '';
    let endTime = '';
    let day = '';
    let track = '';
    let area = '';
    try {
        const sessionTitleContainer = e.querySelector('.session-title');
        if (sessionTitleContainer) {
            link = sessionTitleContainer.children[0].href;
            title = sessionTitleContainer.children[0].textContent;
            id = sessionTitleContainer.getAttribute('data-post-id');
        }
        const sessionTypeContainer = e.querySelector('.session-presenter:first-child');
        if (sessionTypeContainer) {
            type = sessionTypeContainer.textContent;
        }
        const sessionPresenterContainer = e.querySelector('.session-presenter:last-child');
        if (sessionPresenterContainer) {
            presenter = sessionPresenterContainer.textContent;
        }
        const sessionTimeContainer = e.querySelector('.session-time');
        if (sessionTimeContainer) {
            const time = sessionTimeContainer.textContent.split(' - ');
            startTime = time[0];
            endTime = time[1];
        }
        const dayTimeContainer = e.parentElement.parentElement.parentElement.querySelector('.heading:first-child');
        if (dayTimeContainer) {
            day = formatDay(dayTimeContainer.textContent);
        }
        const sessionTrackContainer = e.querySelector('.session-track');
        if (sessionTrackContainer) {
            track = sessionTrackContainer.textContent;
        }
        const difficultyContainer = e.querySelector('.difficulty');
        if (difficultyContainer) {
            area = difficultyContainer.textContent;
        }
    }
    catch (exp) {
        console.error(exp);
    }
    return { id: id, link: link, title: title, type: type, presenter: presenter, startTime: startTime, endTime: endTime, day: day, track: track, area: area };
}

function formatDateToParam(dayStr, timeStr) {
    return `${dayStr.split('-').join('')}T${timeStr.replace(':', '')}00`
}

function createAddToCalendarURL(obj) {
    const type = obj.type.includes('Only') ? `[${obj.type}]` : '';
    const subject = encodeURIComponent(`${obj.title} - ${obj.presenter} ${type}`);
    const dates = `${formatDateToParam(obj.day, obj.startTime)}/${formatDateToParam(obj.day, obj.endTime)}`
    const details = encodeURIComponent(`${obj.area} - ${obj.track}\n${obj.link}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${subject}&dates=${dates}&details=${details}`
}

function objToCalendarCSVFriendly(obj) {
    return {
        subject: `${obj.title} - ${obj.presenter} [${obj.type}]`,
        'Start Date': obj.day,
        'Start Time': obj.startTime,
        'End Date': obj.day,
        'End Time': obj.endTime,
        description: `${obj.area} - ${obj.track} - ${obj.link}`
    }
}

function arrayToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

    return array.reduce((str, next) => {
        str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
        return str;
    }, str);
}

/** Download contents as a file
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
function downloadBlob(content, filename, contentType) {
    // Create a blob
    var blob = new Blob([content], { type: contentType });
    var url = URL.createObjectURL(blob);

    // Create a link to download it
    var pom = document.createElement('a');
    pom.href = url;
    pom.setAttribute('download', filename);
    pom.click();
}

function exportAllSessions(data) {
    let objs = new Array();
    data.forEach(function (value, key) {
        objs.push(objToCalendarCSVFriendly(value));
    });
    const csv = arrayToCSV(objs);
    downloadBlob(csv, 'all_sessions.csv', 'text/csv;charset=utf-8;')
}

function exportMySessions(data) {
    let objs = new Array();
    const myScheduled = document.getElementsByClassName('slide-menu user-schedule');
    if (myScheduled && myScheduled[0]) {
        const myElements = myScheduled[0].querySelectorAll('.sessioncontainer');
        for (let i = 0; i < myElements.length; i++) {
            const element = myElements[i];
            const id = element.querySelector('.remove-from-schedule').getAttribute('data-post-id')
            if (!data.has(id)) {
                console.error('Id not in data: ' + id + ' ' + element);
                continue;
            }
            objs.push(objToCalendarCSVFriendly(data.get(id)));
        }
    }

    if (objs.length == 0) {
        return;
    }
    const csv = arrayToCSV(objs);
    downloadBlob(csv, 'my_sessions.csv', 'text/csv;charset=utf-8;')
}

async function addButtons() {
    // Retrieve all data
    let data = new Map();
    let idToElement = new Map();
    const allElements = document.getElementsByClassName('conferencescheduleholder')[0];
    const addElements = allElements.querySelectorAll('.sessioncontainer');
    for (let i = 0; i < addElements.length; i++) {
        const element = addElements[i];
        const details = getDetails(element);
        data.set(details.id, details);
        idToElement[details.id] = element;

        let div = document.createElement('div');
        div.innerHTML = `<a class="add-to-gcal" style="display:block;" href="${createAddToCalendarURL(details)}" target="_blank">Add to Google Calendar</a>`;
        element.appendChild(div);
    }

    // Add buttons to My Scheduled as well
    const myScheduled = document.getElementsByClassName('slide-menu user-schedule');
    if (myScheduled && myScheduled[0]) {
        const myElements = myScheduled[0].querySelectorAll('.sessioncontainer');
        for (let i = 0; i < myElements.length; i++) {
            const element = myElements[i];
            const id = element.querySelector('.remove-from-schedule').getAttribute('data-post-id')
            if (!data.has(id)) {
                console.error('Id not in data: ' + id);
                continue;
            }
            const details = data.get(id);
            let div = document.createElement('div');
            div.innerHTML = `<a style="display:block;" href="${createAddToCalendarURL(details)}" target="_blank">Add to Google Calendar</a>`;
            element.appendChild(div);
        }
    }

    // Add buttons on header to export whole schedule and user schedule to CSV
    const scheduleButton = document.getElementsByClassName('schedulebutton');
    if (scheduleButton && scheduleButton[0]) {
        const getBtnObj = (label, url) => {
            let obj = document.createElement('a');
            obj.classList.add('schedulebutton');
            obj.style = 'margin-left:10px;';
            obj.innerHTML = label;
            return obj;
        }
        const exportAll = getBtnObj('Export complete schedule to CSV', '#');
        exportAll.addEventListener('click', function () {
            exportAllSessions(data);
        });
        const exportMyScheduled = getBtnObj('Export my schedule to CSV', '#');
        exportMyScheduled.addEventListener('click', function () {
            exportMySessions(data);
        });

        scheduleButton[0].parentElement.appendChild(exportAll);
        scheduleButton[0].parentElement.appendChild(exportMyScheduled);

    }

}

var initializeInfo = setInterval(function () {
    addButtons();
    clearInterval(initializeInfo);
}, 500);