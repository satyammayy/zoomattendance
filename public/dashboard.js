/*
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
 */
class Meeting{
    constructor(name,id,arr){
        this.name = name
        this.id = id
        this.arr = arr
    }
}
class Participant{
    constructor(first,last,attendance, roster, timeJoined , timeLeft) {
        this.firstName = first
        this.lastName = last
        this.state = attendance
        this.partOfRoster = roster
        this.timeJoined = timeJoined // stores ISO time joined, only changed once when participant joins for first time
        this.timeLeft = timeLeft // stores ISO time joined, only changed once when participant joins for first time
    }
}
class PastMeeting{
    constructor(MeetingName, MeetingID, MeetingStart,MeetingEnd,events,docID) {
        this.MeetingName = MeetingName
        this.MeetingID = MeetingID
        this.MeetingStart = MeetingStart
        this.MeetingEnd = MeetingEnd
        this.events = events
        this.docID = docID
    }
}
let Meetings = []
let PastMeetings
let isEditingMeeting = false
let MeetingsdidLoad = false
let Participants = []
let CurrentMessages = []
let EncounteredParticipants = new Set()
let names = []
let CurrentMeeting = ""
let CurrentMeetingID = ""
let CurrentRosterName = ""
let meetingIndex = -1
let currentRecordIndex = -1
let editingIndex = 1
let checkVerificationTimer
let notRegisteredCount = 0
let MeetingIsOccurring = false
let ParticipantTableSortBy = "first" // can be "first" or "last" or "time" or "timeLeft" to sort participants table
let listNamesShown = []
let shouldRefresh = false
let zoomID = -1
let rosterParticipantCount = 0
let rosterCreateButton = $("#add-on-registered-create")
let rosterUpdateButton = $("#add-on-registered-update")
let exportMeetingButton = $("#export-button")
let chooseRoster = $("#dropdown-roster")
let chooseRosterMenu = $("#dropdown-roster-menu")
const filterUpHTML = "<span id=\"filter-caret\" class=\"iconify\" data-icon=\"ion-caret-up\" data-inline=\"false\" style=\"margin-right: -3px\"></span>\n" +
    "                            <span id=\"filter-button-icon\" class=\"iconify\" style=\"font-size: 30px\" data-icon=\"bx:bx-filter-alt\" data-inline=\"false\"></span>"
const filterDownHTML = "<span id=\"filter-caret\" class=\"iconify\" data-icon=\"ion-caret-down\" data-inline=\"false\" style=\"margin-right: -3px\"></span>\n" +
    "                            <span id=\"filter-button-icon\" class=\"iconify\" style=\"font-size: 30px\" data-icon=\"bx:bx-filter-alt\" data-inline=\"false\"></span>"
$("[data-toggle=popover]").popover();
const attrObserver = new MutationObserver((mutations) => {
    mutations.forEach(mu => {
        if (mu.type !== "attributes" && mu.attributeName !== "class") return;
        if($('#filter-drop-menu').hasClass("show")){
            document.getElementById("filter-button").innerHTML = filterUpHTML
        }
        else{
            document.getElementById("filter-button").innerHTML = filterDownHTML
        }
    });
});
const filterMenu = document.getElementById("filter-drop-menu");
attrObserver.observe(filterMenu, {attributes: true});

function hideRegisterRosterButtons(){
    rosterCreateButton.prop('disabled',true)
    rosterCreateButton.hide()
    rosterUpdateButton.prop('disabled',true)
    rosterUpdateButton.hide()
}
function showUpdateRosterButton(){
    rosterUpdateButton.prop('disabled',false)
    rosterUpdateButton.show()
}
function showCreateRosterButton() {
    rosterCreateButton.prop('disabled', false)
    rosterCreateButton.show()
}
function hideUpdateRosterButton(){
    rosterUpdateButton.prop('disabled',true)
    rosterUpdateButton.hide()
}
function hideCreateRosterButton(){
    rosterCreateButton.prop('disabled',true)
    rosterCreateButton.hide()
}
function hideChooseRoster(){
    chooseRoster.hide()
    chooseRoster.prop("disabled",true)
    chooseRosterMenu.empty()
}
function hideExportButton(){
    exportMeetingButton.hide()
    exportMeetingButton.prop("disabled",true)
}
function showExportButton(){
    exportMeetingButton.show()
    exportMeetingButton.prop("disabled",false)
}
function createRosterLink(name,id,index){
    return "<a onClick=\"changeRoster(this)\" data-meeting-id=\"" + id + "\" data-roster-name=\"" + name + "\" data-roster-index=\"" + index + "\" class=\"dropdown-item\">" + name + "</a>"
}
function createRosterLinkActive(name,id,index){
    return "<a onClick=\"changeRoster(this)\" data-meeting-id=\"" + id + "\" data-roster-name=\"" + name + "\" data-roster-index=\"" + index + "\" class=\"dropdown-item roster-active\">" + name + "</a>"
}
function showChooseRoster(){
    chooseRosterMenu.empty()
    chooseRoster.show()
    chooseRoster.prop("disabled",false)
    if(meetingIndex !== -1){
        for(let i = 0; i < Meetings.length;i++){
            if(Meetings[i].id === CurrentMeetingID && i === meetingIndex){
                CurrentRosterName = Meetings[i].name
                chooseRosterMenu.append(createRosterLinkActive(Meetings[i].name, Meetings[i].id,i))
            }
            else if (Meetings[i].id === CurrentMeetingID){
                chooseRosterMenu.append(createRosterLink(Meetings[i].name, Meetings[i].id,i))
            }
        }
    }
}
function changeRoster(roster){
    $("#dropdown-roster-menu>a.roster-active").removeClass("roster-active");
    $(roster).addClass("roster-active")
    meetingIndex = $(roster).data("roster-index")
    CurrentRosterName = Meetings[meetingIndex].name
    refreshTable()
}
hideRegisterRosterButtons()
hideChooseRoster()
hideExportButton()
const studentTableBlock = "<th scope=\"col\"> <input type=\"text\" placeholder=\"First name\" class=\"form-control student-name student-first-name modal-input\"></th>\n" +
    "<th scope=\"col\"> <input type=\"text\" placeholder=\"Last name\" class=\"form-control student-name modal-input\"></th>\n" +
    "<th scope=\"col\"> <button onclick=\"deleteStudent(this)\" class=\"btn trash-btn\" type=\"button\"><span class=\"iconify\" data-inline=\"false\" data-icon=\"ei:trash\" style=\"font-size: 30px;\"></span></button></th>"

const firestore = firebase.firestore()
const auth = firebase.auth()
function arr_diff (newMess, oldMess) {
    let diff = []
    for(let i = oldMess.length; i < newMess.length;i++){
        diff.push(newMess[i])
    }
    return diff
}

firestore.collection("UpdateBrowser").doc("updateDate").onSnapshot((doc) => {
    if(shouldRefresh) {
        window.location.href = "/dashboard";
    }
    shouldRefresh = true
})

auth.onAuthStateChanged((user) => {
    if (user) {
        firestore.collection("Users").doc(user.uid).onSnapshot((doc) => {
            if(!doc.exists || !doc){
                window.location.href = "/";
            }
        })
        firestore.collection("ZoomOAuth").where("firebaseID","==",user.uid).get().then((querySnapshot)=> {
            querySnapshot.forEach((doc) => {
                zoomID = doc.data().userID;
            })

            document.getElementById("myTabContent").hidden = false

            document.getElementById("user-name").innerHTML = "Welcome " + user.displayName
            firestore.collection("Periods").where("useruid", "==", user.uid)
                .onSnapshot((querySnapshot) => {
                    MeetingsdidLoad = false
                    Meetings = []
                    querySnapshot.forEach((doc) => {
                        const currData = doc.data()
                        Meetings.push(new Meeting(currData.periodName, currData.meetingId, currData.studentsNames))
                    })
                    const meetingTable = document.getElementById("my-meetings-table")
                    Meetings.sort(compareMeetings)
                    while (meetingTable.rows.length > 1) {
                        meetingTable.deleteRow(1)
                    }
                    const studentInputTable = document.getElementById("student-input-table")
                    for (let i = Meetings.length - 1; i >= 0; i--) {
                        let currentRow = meetingTable.insertRow(1)
                        currentRow.classList.add("meeting-row")
                        currentRow.addEventListener("click", function () {
                            let index = this.rowIndex
                            currentRecordIndex = index - 1
                            document.getElementById("meeting-modal-title").innerHTML = "Edit Roster"
                            editingIndex = index
                            $('#add-edit-meeting-modal').modal('show');
                            const currentMeeting = Meetings[index - 1]
                            $("#meeting-id-input-field").val(currentMeeting.id)
                            $("#meeting-name-input-field").val(currentMeeting.name)
                            isEditingMeeting = true
                            $("#delete-meeting-button").prop('disabled', false)
                            $("#delete-meeting-button").show()
                            while (studentInputTable.rows.length !== 0) {
                                studentInputTable.deleteRow(0)
                            }
                            rosterParticipantCount = 0
                            for (let j = 0; j < currentMeeting.arr.length; j++) {
                                addStudent(CryptoJS.AES.decrypt(currentMeeting.arr[j], user.uid).toString(CryptoJS.enc.Utf8))
                            }
                        })
                        let cell1 = currentRow.insertCell(0)
                        let cell2 = currentRow.insertCell(1)
                        cell1.innerHTML = Meetings[i].name
                        cell2.innerHTML = Meetings[i].id
                        cell2.classList.add("meeting-id-text")
                    }
                    MeetingsdidLoad = true
                    refreshTable()
                });
            firestore.collection("Records").where("useruid", "==", user.uid)
                .onSnapshot((querySnapshot) => {
                    document.getElementById("records-search-input-field").value = ""
                    PastMeetings = []
                    querySnapshot.forEach((doc) => {
                        const currData = doc.data()
                        PastMeetings.push(new PastMeeting(currData.MeetingName, currData.MeetingID, currData.MeetingStart, currData.MeetingEnd, currData.Events, doc.id))
                    })
                    const recordTable = document.getElementById("records-table")
                    PastMeetings.sort(comparePastMeetings)
                    while (recordTable.rows.length > 1) {
                        recordTable.deleteRow(1)
                    }
                    const currentRecordTable = document.getElementById("current-record-table")
                    for (let i = PastMeetings.length - 1; i >= 0; i--) {
                        let currentRow = recordTable.insertRow(1)
                        currentRow.classList.add("record-row");
                        currentRow.addEventListener("click", function () {
                            let index = this.rowIndex
                            currentRecordIndex = index - 1
                            const currentMeeting = PastMeetings[index - 1]
                            document.getElementById("current-record-name").innerHTML = "Meeting Name: " + currentMeeting.MeetingName
                            document.getElementById("current-record-id").innerHTML = "Meeting ID: " + currentMeeting.MeetingID
                            document.getElementById("current-record-date").innerHTML = "Date: " + currentMeeting.MeetingStart.toDate().toLocaleString() + " - " + currentMeeting.MeetingEnd.toDate().toLocaleString()
                            $('#meeting-record-modal').modal('show');
                            while (currentRecordTable.rows.length !== 0) {
                                currentRecordTable.deleteRow(0)
                            }
                            for (let j = 0; j < currentMeeting.events.length; j++) {
                                let row = currentRecordTable.insertRow(currentRecordTable.rows.length)
                                let cell1 = row.insertCell(0);
                                let currentRecord = CryptoJS.AES.decrypt(currentMeeting.events[j], user.uid).toString(CryptoJS.enc.Utf8);
                                currentRecord = currentRecord.split(" ")
                                let currentRecordDate = ""
                                for (let k = currentRecord.length - 9; k < currentRecord.length; k++) {
                                    currentRecordDate += currentRecord[k];
                                    if (k !== currentRecord.length - 1) {
                                        currentRecordDate += " ";
                                    }
                                }
                                currentRecord.splice(currentRecord.length - 9, 9)
                                currentRecord = currentRecord.join(" ")
                                const currentRecordLocaleDate = new Date(currentRecordDate)
                                currentRecord += " at: " + currentRecordLocaleDate.toLocaleString()
                                cell1.innerHTML = currentRecord
                            }
                        })
                        let cell1 = currentRow.insertCell(0)
                        let cell2 = currentRow.insertCell(1)
                        let cell3 = currentRow.insertCell(2)
                        currentRow.style.backgroundColor = "#ffffff"
                        cell1.innerHTML = PastMeetings[i].MeetingName
                        cell2.innerHTML = PastMeetings[i].MeetingID
                        cell3.innerHTML = PastMeetings[i].MeetingStart.toDate().toLocaleString()
                        cell2.classList.add("meeting-id-text")
                    }

                });
            firestore.collection("CurrentMeetings").doc(zoomID).onSnapshot((doc) => {
                if (MeetingsdidLoad) {
                    evaluateParticipantTable(doc)
                } else {
                    let getMeetingInterval = setInterval(() => {
                        if (MeetingsdidLoad) {
                            evaluateParticipantTable(doc)
                            clearInterval(getMeetingInterval)
                        }
                    }, 500)
                }
            }, (error) => {
                redNotification("Problem connecting to server")
                console.error(error.message)
            })
        })
    } else {
        //user not signed in
        window.location.href = "/";
    }
});
document.getElementById("meeting-id-attendance").hidden = true
$("input").on("click", function(){
    $(this).removeClass('is-invalid')
})
$(function() {
    $('#meeting-id-input-field').on('keypress', function(e) {
        if (e.which === 32 || document.getElementById("meeting-id-input-field").value.length >= 11){
            return false;
        }
    });
});
$('#meeting-id-input-field').on('paste', function (event) {
    if (event.originalEvent.clipboardData.getData('Text').match(/[^\d]/)) {
        event.preventDefault();
    }
});

function updateParticipantTable(){
    if( document.getElementById("present-filter").classList.contains("filter-active")){
        filterClick("present-filter")
    }
    else if( document.getElementById("all-filter").classList.contains("filter-active")){
        filterClick("all-filter")
    }
    else if( document.getElementById("absent-filter").classList.contains("filter-active")){
        filterClick("absent-filter")
    }
    else if( document.getElementById("left-meeting-filter").classList.contains("filter-active")){
        filterClick("left-meeting-filter")
    }
    else if( document.getElementById("not-registered-filter").classList.contains("filter-active")){
        filterClick("not-registered-filter")
    }
}
function refreshTable(){
    document.getElementById("refresh").disabled = true
    document.getElementById("refresh-cover").classList.add("running")
    document.getElementById("ld-spin").style.display = "block"
    Participants = []
    CurrentMessages = []
    meetingIndex = -1
    CurrentMeeting = ""
    CurrentMeetingID = ""
    for(let i = 0; i < Meetings.length;i++){
        if(Meetings[i].name.trim() === CurrentRosterName.trim() && CurrentRosterName !== ""){
            meetingIndex = i;
            break
        }
    }
    setTimeout(()=>{
        firestore.collection("CurrentMeetings").doc(zoomID).get().then((doc)=>{
            evaluateParticipantTable(doc)
        }).catch((error)=>{
            redNotification(error.message)
            document.getElementById("ld-spin").style.display = "none"
            document.getElementById("refresh").disabled = false
            document.getElementById("refresh-cover").classList.remove("running")
            updateParticipantTable()
        })
        document.getElementById("ld-spin").style.display = "none"
        document.getElementById("refresh").disabled = false
        document.getElementById("refresh-cover").classList.remove("running")
    },1000)
}

function decryptMessages(messages){
    for(let i = 0; i < messages.length; i++){
        const currentMessage = CryptoJS.AES.decrypt(messages[i], auth.currentUser.uid).toString(CryptoJS.enc.Utf8);
        console.log(currentMessage)
    }
}
function exportMeeting(){
    if(MeetingIsOccurring){
        const downloadElement = document.createElement('a')
        const now = new Date()
        let recordDataString = "First_Name,Last_Name,Time_First_Joined,Time_Last_Left,Status\n"
        const downloadName = CurrentMeeting + " - " + CurrentMeetingID + " - " + now.toLocaleString()
        for(let i = 0; i < Participants.length; i++){
            let participantTimeJoined = ""
            let participantTimeLeft = ""
            if(Participants[i].timeJoined){
                participantTimeJoined = isoToLocalString(Participants[i].timeJoined)
            }
            if(Participants[i].timeLeft){
                participantTimeLeft = isoToLocalString(Participants[i].timeLeft)
            }
            recordDataString += Participants[i].firstName + "," + Participants[i].lastName + "," + participantTimeJoined + "," + participantTimeLeft + "," + Participants[i].state + "\n"
        }
        downloadElement.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(recordDataString))
        downloadElement.setAttribute('download', downloadName);
        document.body.appendChild(downloadElement);
        downloadElement.click();
        document.body.removeChild(downloadElement);
    }
}
function evaluateParticipantTable(doc){
    if(doc.data()){
        const meetingMessages = doc.data().messageLog
        // newCalculated and newMessages are created to make sure that newMessages holds the value and not the reference
        const newCalculated = arr_diff(meetingMessages,CurrentMessages)
        let newMessages = []
        for(let i = 0; i < newCalculated.length; i++){
            CurrentMessages.push(newCalculated[i])
            newMessages.push(newCalculated[i])
        }
        // add new messages to current messages
        if(meetingMessages.length === 0){
            document.getElementById("status-dot").classList.remove("dot-warning")
            document.getElementById("status-dot").classList.remove("dot-success")
            document.getElementById("status-dot").classList.add("dot-danger")
            document.getElementById("currentMeeting-name").innerHTML = "No Meeting Has Started"
            document.getElementById("meeting-id-attendance").value = ""
            document.getElementById("meeting-id-attendance").hidden = true
            CurrentMeeting = ""
            EncounteredParticipants = new Set()
            CurrentMeetingID = ""
            CurrentMessages = []
            Participants = []
            document.getElementById("current-participants").innerHTML = ""
            document.getElementById("current-participant-number").innerHTML = ""
            meetingIndex = -1
            CurrentRosterName = ""
            hideChooseRoster()
            clearTable()
            hideExportButton()
        }
        for(let j = 0; j < newMessages.length; j++){
            const currentMessage = CryptoJS.AES.decrypt(newMessages[j], auth.currentUser.uid).toString(CryptoJS.enc.Utf8);
            const data = currentMessage.split(" ")
            const eventType = data[0]
            if(eventType === "meeting.started"){
                showExportButton()
                EncounteredParticipants = new Set()
                MeetingIsOccurring = true
                const participantTable = document.getElementById("participant-table")
                while(participantTable.rows.length > 1){
                    participantTable.deleteRow(1)
                }
                document.getElementById("meeting-id-attendance").hidden = false
                let meetingName = ""
                for(let i = 1; i < data.length;i++){
                    meetingName += data[i] + " "
                }
                CurrentMeeting = meetingName
                document.getElementById("status-dot").classList.remove("dot-danger")
                if(meetingIndex === -1){
                    document.getElementById("status-dot").classList.remove("dot-success")
                    document.getElementById("status-dot").classList.add("dot-warning")
                }
                else{
                    document.getElementById("status-dot").classList.remove("dot-warning")
                    document.getElementById("status-dot").classList.add("dot-success")
                }
                document.getElementById("currentMeeting-name").innerHTML = "Meeting: " + meetingName
                updateParticipantTable()
            }
            else if(eventType === "meeting.id"){
                CurrentMeetingID = data[1]
                document.getElementById("meeting-id-attendance").innerHTML = "ID: " + CurrentMeetingID
                CurrentMeeting = ""
                document.getElementById("status-dot").classList.remove("dot-success")
                document.getElementById("status-dot").classList.add("dot-danger")
                if(meetingIndex === -1){
                    for(let i = 0; i < Meetings.length; i++){
                        if(String(Meetings[i].id) === String(CurrentMeetingID)){
                            meetingIndex = i;
                            CurrentRosterName = Meetings[meetingIndex].name
                            break
                        }
                    }
                }
                if(meetingIndex !== -1){
                    showChooseRoster()
                    for(let i = 0 ; i < Meetings[meetingIndex].arr.length; i++){
                        let decryptedName = CryptoJS.AES.decrypt(Meetings[meetingIndex].arr[i],auth.currentUser.uid).toString(CryptoJS.enc.Utf8);
                        const name = decryptedName.split(" ")
                        const participantFirst = name[0]
                        const participantLast = name[name.length-1]
                        let currParticipant = new Participant(participantFirst, participantLast, "Absent", true, " "," ")// blank time joined and time left if participant hasnt joined yet
                        currParticipant.bufferCount = 0
                        Participants.unshift(currParticipant)

                    }
                }
                else{
                    hideChooseRoster()
                }
                updateParticipantTable()
            }
            else if(eventType === "participant.joined"){
                let participantFirst = ""
                let participantLast = ""
                if(data.length === 4){
                    participantFirst = data[1]
                }
                else if(data.length > 4){
                    participantFirst = data[1]
                    participantLast = data[data.length-3] // 3rd word from right instead of 2nd due to adding time at end of data
                }
                let participantEmail = data[data.length-2]// same reason as ^^^
                let fullName = participantFirst.trim() + " " + participantLast.trim()
                let now = data[data.length-1] // gets time from data in ISO format
                EncounteredParticipants.add(fullName.trim())
                if(meetingIndex !== -1){
                    let wasPresent = false
                    let didActOnEvent = false
                    let presentParticipantIndex = -1
                    for(let i = 0 ; i < Participants.length; i++){
                        if(Participants[i].firstName.toLowerCase().trim() === participantFirst.toLowerCase().trim() && Participants[i].lastName.toLowerCase().trim() === participantLast.toLowerCase().trim()){
                            if(Participants[i].email && participantEmail === Participants[i].email){
                                wasPresent = true;
                                presentParticipantIndex = i;
                            }
                            if(Participants[i].email && participantEmail === Participants[i].email && Participants[i].state === "Left Meeting"){
                                didActOnEvent = true
                                let currParticipant = new Participant(participantFirst, participantLast, "Present",true, Participants[i].timeJoined, Participants[i].timeLeft)// doesnt change time joined if left meeting
                                Participants.splice(i,1)
                                currParticipant.bufferCount = 1
                                currParticipant.email = participantEmail
                                Participants.unshift(currParticipant)
                                break;
                            }
                        }
                    }
                    if(!wasPresent){
                        let isRegistered = false
                        didActOnEvent = true
                        for(let i = 0; i < Participants.length; i++){
                            if(Participants[i].state === "Absent" && Participants[i].firstName.toLowerCase().trim() === participantFirst.toLowerCase().trim() && Participants[i].lastName.toLowerCase().trim() === participantLast.toLowerCase().trim()){
                                isRegistered = true;
                                let currParticipant = new Participant(participantFirst, participantLast, "Present",true, now, "")// if going from absent --> present, add time joined, time last left is null cuz they werent previously present
                                Participants.splice(i,1)
                                currParticipant.bufferCount = 1
                                currParticipant.email = participantEmail
                                Participants.unshift(currParticipant)
                                break;
                            }
                        }
                        if(!isRegistered){
                            let currParticipant = new Participant(participantFirst, participantLast, "Not Registered",false, now, "")// if going from ___ --> not registered, add time joined and blank timeleft
                            currParticipant.bufferCount = 1
                            currParticipant.email = participantEmail
                            Participants.unshift(currParticipant)
                        }
                    }
                    if(!didActOnEvent){
                        Participants[presentParticipantIndex].bufferCount += 1
                    }
                }
                else{
                    let wasPresent = false
                    for(let i = 0; i < Participants.length; i++){
                        if(Participants[i].state === "Not Registered" && Participants[i].email === participantEmail && Participants[i].firstName.toLowerCase().trim() === participantFirst.toLowerCase().trim() && Participants[i].lastName.toLowerCase().trim() === participantLast.toLowerCase().trim()){
                            Participants[i].bufferCount += 1
                            wasPresent = true;
                            break;
                        }
                    }
                    if(!wasPresent){
                        let currParticipant = new Participant(participantFirst, participantLast, "Not Registered",false, now, "") // add time
                        currParticipant.bufferCount = 1
                        currParticipant.email = participantEmail
                        Participants.unshift(currParticipant)
                    }
                }
                updateParticipantTable()
            }
            else if(eventType === "participant.left"){
                let now = data[data.length-1] // gets time from data in ISO format
                let participantFirst = ""
                let participantLast = ""
                if(data.length === 4){
                    participantFirst = data[1]
                }
                else if(data.length > 4){
                    participantFirst = data[1]
                    participantLast = data[data.length-3] // changed length, so need to change this minus
                }
                let participantEmail = data[data.length-2]// changed length, so need to change this minus
                let fullName = participantFirst.trim() + " " + participantLast.trim()
                for(let i = 0 ; i < Participants.length; i++){
                    if(Participants[i].firstName.toLowerCase().trim() === participantFirst.toLowerCase().trim() && Participants[i].lastName.toLowerCase().trim() === participantLast.toLowerCase().trim() && Participants[i].email && Participants[i].email === participantEmail){
                        if(Participants[i].state === "Not Registered"){
                            if(Participants[i].bufferCount === 1){
                                Participants.splice(i,1)
                            }
                            else{
                                Participants[i].bufferCount -= 1
                            }
                            break;
                        }
                        else if(Participants[i].state === "Present"){
                            if(Participants[i].bufferCount === 1){
                                let currParticipant = new Participant(participantFirst, participantLast, "Left Meeting",true, Participants[i].timeJoined, now) // doesnt add new time if partic goes from left meeting --> present
                                Participants.splice(i,1)
                                currParticipant.bufferCount = 0
                                currParticipant.email = participantEmail
                                Participants.unshift(currParticipant)
                                break;
                            }
                            else{
                                Participants[i].bufferCount -= 1;
                            }
                        }
                    }
                }
                updateParticipantTable()
            }
        }
        document.getElementById("ld-spin").style.display = "none"
        document.getElementById("refresh").disabled = false
        document.getElementById("refresh-cover").classList.remove("running")
    }
    else{
        if(MeetingIsOccurring){
            document.getElementById("status-dot").classList.remove("dot-warning")
            document.getElementById("status-dot").classList.remove("dot-success")
            document.getElementById("status-dot").classList.add("dot-danger")
            document.getElementById("currentMeeting-name").innerHTML = "No Meeting Has Started"
            document.getElementById("meeting-id-attendance").value = ""
            document.getElementById("meeting-id-attendance").hidden = true
            hideExportButton()
            hideRegisterRosterButtons()
            if(meetingIndex === -1){
                $('#add-edit-meeting-modal').modal('show');
                $("#meeting-id-input-field").val(CurrentMeetingID)
                $("#meeting-name-input-field").val(CurrentMeeting)
                $("#delete-meeting-button").prop('disabled', true)
                $("#delete-meeting-button").hide()
                $("#meeting-id-input-field").prop('disabled',true)
                $("#meeting-name-input-field").prop('disabled',true)
                $("#save-meeting-button").innerHTML = "Add Roster"
                const studentInputTable = document.getElementById("student-input-table")
                while (studentInputTable.rows.length !== 0) {
                    studentInputTable.deleteRow(0)
                }
                rosterParticipantCount = 0
                EncounteredParticipants.forEach(participant => {
                    addStudent(participant)
                })
                document.getElementById("meeting-modal-title").innerHTML = "Add Roster"
            }
            else{
                greenNotification("Your meeting has been saved")
            }
            CurrentMeeting = ""
            CurrentMeetingID = ""
            CurrentMessages = []
            meetingIndex = -1
            CurrentRosterName = ""
            Participants = []
            MeetingIsOccurring = false
            EncounteredParticipants = new Set()
            document.getElementById("current-participants").innerHTML = ""
            document.getElementById("current-participant-number").innerHTML = ""
            hideChooseRoster()
            clearTable()
        }
        else{
            document.getElementById("status-dot").classList.remove("dot-warning")
            document.getElementById("status-dot").classList.remove("dot-success")
            document.getElementById("status-dot").classList.add("dot-danger")
            document.getElementById("currentMeeting-name").innerHTML = "No Meeting Has Started"
            document.getElementById("meeting-id-attendance").value = ""
            document.getElementById("meeting-id-attendance").hidden = true
            CurrentMeeting = ""
            CurrentMeetingID = ""
            Participants = []
            meetingIndex = -1
            CurrentRosterName = ""
            document.getElementById("current-participants").innerHTML = ""
            document.getElementById("current-participant-number").innerHTML = ""
            CurrentMessages = []
            hideChooseRoster()
            hideExportButton()
            clearTable()
            document.getElementById("ld-spin").style.display = "none"
            document.getElementById("refresh").disabled = false
            document.getElementById("refresh-cover").classList.remove("running")
            hideRegisterRosterButtons()
        }
    }
}
function clearTable(){
    const participantTable = document.getElementById("participant-table")
    const currentNumRows = participantTable.rows.length
    for(let i = 0; i < currentNumRows-1; i++){
        participantTable.deleteRow(1);
    }
}
$("#student-search-input-field").on('keyup', function (e) {
    const participantTable = document.getElementById("participant-table")
    currValue = $("#student-search-input-field").val();
    document.getElementById("all-filter").classList.add("filter-active")
    document.getElementById("present-filter").classList.remove("filter-active")
    document.getElementById("absent-filter").classList.remove("filter-active")
    document.getElementById("not-registered-filter").classList.remove("filter-active")
    document.getElementById("left-meeting-filter").classList.remove("filter-active")
    if (e.key === 'Enter' || e.keyCode === 13) {
        $("#student-search-input-field").blur()
    }

    clearTable()
    listNamesShown = []
    for(let i = Participants.length-1; i >= 0; i--){
        const fullName = Participants[i].firstName + " " + Participants[i].lastName
        if(fullName.toLowerCase().includes(currValue.toLowerCase().trim())){
            let row = participantTable.insertRow(1+findIndexOfRow(i));
            row.style.backgroundColor = "#ffffff"
            row.style.color = "#000000"
            let cell1 = row.insertCell(0)
            let cell2 = row.insertCell(1)
            let cell3 = row.insertCell(2)
            let cell4TimeLeft = row.insertCell(3)
            let cell5State = row.insertCell(4)
            if(Participants[i].state === "Not Registered"){
                row.style.backgroundColor = "#b8b8b8"
                cell5State.style.color = "#000000"
            }
            else if(Participants[i].state === "Absent"){
                cell5State.style.color = "#dd174d"
            }
            else if(Participants[i].state === "Left Meeting"){
                cell5State.style.color = "#ddb217"
            }
            else if(Participants[i].state === "Present"){
                cell5State.style.color = "#00bc50"
            }
            cell5State.innerHTML = Participants[i].state
            cell1.innerHTML = Participants[i].firstName
            cell2.innerHTML = Participants[i].lastName
            cell3.innerHTML = isoToLocalString(Participants[i].timeJoined)
            cell4TimeLeft.innerHTML = isoToLocalString(Participants[i].timeLeft)
        }
    }

});
function filterClick(clicked_id){
    notRegisteredCount = 0
    $("#student-search-input-field").val("")
    const participantTable = document.getElementById("participant-table")
    document.getElementById(clicked_id).classList.add("filter-active")
    let presentParticipantCount = 0;
    let totalParticipants = 0;
    clearTable()
    listNamesShown = []
    if(clicked_id === "all-filter"){
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            let row = participantTable.insertRow(1+ findIndexOfRow(i));
            Participants[i].row = row
            if(Participants[i].state === "Not Registered"){
                notRegisteredCount+=1
                row.style.backgroundColor = "#b8b8b8"
                presentParticipantCount += 1
            }
            else{
                row.style.backgroundColor = "#ffffff"
            }
            row.style.color = "#000000"
            let cell1 = row.insertCell(0)
            let cell2 = row.insertCell(1)
            let cell3 = row.insertCell(2)
            let cell4TimeLeft = row.insertCell(3)
            let cell5Status = row.insertCell(4)
            cell5Status.innerHTML = Participants[i].state
            if(Participants[i].state === "Present"){
                cell5Status.style.color = "#00bc50"
                presentParticipantCount += 1
                totalParticipants += 1
            }
            if(Participants[i].state === "Absent"){
                cell5Status.style.color = "#dd174d"
                totalParticipants += 1
            }
            if(Participants[i].state === "Left Meeting"){
                cell5Status.style.color = "#ddb217"
                totalParticipants += 1
            }
            cell1.innerHTML = Participants[i].firstName
            cell2.innerHTML = Participants[i].lastName
            cell3.innerHTML = isoToLocalString(Participants[i].timeJoined)
            cell4TimeLeft.innerHTML = isoToLocalString(Participants[i].timeLeft)
        }
    }
    else if(clicked_id === "present-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Present"){
                presentParticipantCount += 1
                let row = participantTable.insertRow(1+ findIndexOfRow(i));
                row.style.backgroundColor = "#ffffff"
                row.style.color = "#000000"
                let cell1 = row.insertCell(0)
                let cell2 = row.insertCell(1)
                let cell3 = row.insertCell(2)// cell 3 contains time now
                let cell4TimeLeft = row.insertCell(3)
                let cell5State = row.insertCell(4) // changed cell3 to cell4
                cell5State.innerHTML = Participants[i].state
                cell5State.style.color = "#00bc50"
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
                cell3.innerHTML = isoToLocalString(Participants[i].timeJoined)
                cell4TimeLeft.innerHTML = isoToLocalString(Participants[i].timeLeft)
                totalParticipants += 1
            }
            else if(Participants[i].state === "Not Registered"){
                presentParticipantCount += 1
                notRegisteredCount += 1
            }
            else if(Participants[i].state === "Absent"){
                totalParticipants += 1
            }
            else if(Participants[i].state === "Left Meeting"){
                totalParticipants += 1
            }
        }
    }
    else if(clicked_id === "absent-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Absent"){
                let row = participantTable.insertRow(1+ findIndexOfRow(i));
                row.style.backgroundColor = "#ffffff"
                row.style.color = "#000000"
                let cell1 = row.insertCell(0)
                let cell2 = row.insertCell(1)
                let cell3 = row.insertCell(2)// cell 3 contains time now
                let cell4TimeLeft = row.insertCell(3)
                let cell5State = row.insertCell(4) // changed cell3 to cell4
                cell5State.innerHTML = Participants[i].state
                cell5State.style.color = "#dd174d"
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
                cell3.innerHTML = ""
                cell4TimeLeft.innerHTML = ""
                totalParticipants += 1
            }
            else if(Participants[i].state === "Present"){
                presentParticipantCount += 1
                totalParticipants += 1
            }
            else if(Participants[i].state === "Not Registered"){
                notRegisteredCount += 1
                presentParticipantCount += 1
            }
            else if(Participants[i].state === "Left Meeting"){
                totalParticipants += 1
            }
        }
    }
    else if(clicked_id === "not-registered-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("left-meeting-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Not Registered"){
                notRegisteredCount += 1
                let row = participantTable.insertRow(1+ findIndexOfRow(i));
                row.style.backgroundColor = "#b8b8b8"
                row.style.color = "#000000"
                let cell1 = row.insertCell(0)
                let cell2 = row.insertCell(1)
                let cell3 = row.insertCell(2)// cell 3 contains time now
                let cell4TimeLeft = row.insertCell(3)
                let cell5State = row.insertCell(4) // changed cell3 to cell4
                cell5State.innerHTML = Participants[i].state
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
                cell3.innerHTML = isoToLocalString(Participants[i].timeJoined)
                cell4TimeLeft.innerHTML = ""
                presentParticipantCount += 1
            }
            else if(Participants[i].state === "Present"){
                presentParticipantCount += 1
                totalParticipants += 1
            }
            else if(Participants[i].state === "Left Meeting"){
                totalParticipants += 1
            }
            else if(Participants[i].state === "Absent"){
                totalParticipants += 1
            }
        }
    }
    else if(clicked_id === "left-meeting-filter"){
        document.getElementById("all-filter").classList.remove("filter-active")
        document.getElementById("absent-filter").classList.remove("filter-active")
        document.getElementById("present-filter").classList.remove("filter-active")
        document.getElementById("not-registered-filter").classList.remove("filter-active")
        for(let i = Participants.length-1; i >= 0; i--){
            if(Participants[i].state === "Left Meeting"){
                let row = participantTable.insertRow(1+ findIndexOfRow(i));
                row.style.backgroundColor = "#ffffff"
                let cell1 = row.insertCell(0)
                let cell2 = row.insertCell(1)
                let cell3 = row.insertCell(2)// cell 3 contains time now
                let cell4TimeLeft = row.insertCell(3)
                let cell5State = row.insertCell(4) // changed cell3 to cell4
                cell5State.innerHTML = Participants[i].state
                cell5State.style.color = "#ddb217"
                cell1.innerHTML = Participants[i].firstName
                cell2.innerHTML = Participants[i].lastName
                cell3.innerHTML = isoToLocalString(Participants[i].timeJoined)
                cell4TimeLeft.innerHTML = isoToLocalString(Participants[i].timeLeft)
                totalParticipants += 1
            }
            else if(Participants[i].state === "Not Registered"){
                notRegisteredCount += 1
                presentParticipantCount += 1
            }
            else if(Participants[i].state === "Present"){
                presentParticipantCount += 1
                totalParticipants += 1
            }
            else if(Participants[i].state === "Absent"){
                totalParticipants += 1
            }
        }
    }
    if(MeetingIsOccurring && meetingIndex === -1){
        document.getElementById("current-participants").innerHTML = "Participants: "
        document.getElementById("current-participant-number").innerHTML = String(presentParticipantCount)
    }
    else if(MeetingIsOccurring){
        document.getElementById("current-participants").innerHTML = "Participants: "
        document.getElementById("current-participant-number").innerHTML = String(presentParticipantCount) + " out of " + String(totalParticipants)
    }
    else{
        document.getElementById("current-participants").innerHTML = ""
        document.getElementById("current-participant-number").innerHTML = ""
    }
    if(notRegisteredCount > 0){
        if(meetingIndex === -1){
            hideUpdateRosterButton()
            showCreateRosterButton()
        }
        else{
            showCreateRosterButton()
            showUpdateRosterButton()
        }
    }
    else{
        hideRegisterRosterButtons()
    }
}

function isoToLocalString(ISO){

    let date = new Date(ISO) // converts ISO to date Class
    let local = date.toLocaleTimeString() // converts Date into local time string
    if (local === "Invalid Date"){
        local = ""
    }
    return local
}

function sortByLast(){
    ParticipantTableSortBy = "last"
    let lastButton = document.getElementById("lastNameBtn")
    lastButton.style.color = "#F5B364"
    let firstButton = document.getElementById("firstNameBtn")
    firstButton.style.color = "white"
    let timeButton = document.getElementById("timeJoinedBtn")
    timeButton.style.color = "white"
    let timeLeftButton = document.getElementById("timeLeftBtn")
    timeLeftButton.style.color = "white"
    updateParticipantTable()
}
function sortByFirst(){
    ParticipantTableSortBy = "first"
    let lastButton = document.getElementById("lastNameBtn")
    lastButton.style.color = "white"
    let firstButton = document.getElementById("firstNameBtn")
    firstButton.style.color = "#F5B364"
    let timeButton = document.getElementById("timeJoinedBtn")
    timeButton.style.color = "white"
    let timeLeftButton = document.getElementById("timeLeftBtn")
    timeLeftButton.style.color = "white"
    updateParticipantTable()
}

function sortByTimeJoined(){
    ParticipantTableSortBy = "time"
    let lastButton = document.getElementById("lastNameBtn")
    lastButton.style.color = "white"
    let firstButton = document.getElementById("firstNameBtn")
    firstButton.style.color = "white"
    let timeButton = document.getElementById("timeJoinedBtn")
    timeButton.style.color = "#F5B364"
    let timeLeftButton = document.getElementById("timeLeftBtn")
    timeLeftButton.style.color = "white"
    updateParticipantTable()
}
function sortByTimeLeft(){
    ParticipantTableSortBy = "timeLeft"
    let lastButton = document.getElementById("lastNameBtn")
    lastButton.style.color = "white"
    let firstButton = document.getElementById("firstNameBtn")
    firstButton.style.color = "white"
    let timeButton = document.getElementById("timeJoinedBtn")
    timeButton.style.color = "white"
    let timeLeftButton = document.getElementById("timeLeftBtn")
    timeLeftButton.style.color = "#F5B364"
    updateParticipantTable()
}

function findIndexOfRow( i){

    let searchFor;
    if(ParticipantTableSortBy === "first"){
        searchFor = Participants[i].firstName
        searchFor = searchFor.toLowerCase()
    }
    else if (ParticipantTableSortBy === "last"){
        searchFor = Participants[i].lastName
        searchFor = searchFor.toLowerCase()
    }
    else if(ParticipantTableSortBy === "time"){
        searchFor = Participants[i].timeJoined
    }
    else if (ParticipantTableSortBy === "timeLeft"){
        searchFor = Participants[i].timeLeft
    }
    let low = 0
    let high = listNamesShown.length-1
    let mid;
    while(low<=high){
        mid = Math.floor((low+high)/2)
        let temp = listNamesShown[mid]
        if(temp < searchFor){
            low = mid +1
        }else if (temp > searchFor){
            high = mid-1
        }else if (temp === searchFor){
            listNamesShown.splice(mid,0,searchFor)
            return mid;
        }
    }
    listNamesShown.splice(low,0,searchFor)
    return low;
}

function addMeetingModal(){
    const studentInputTable = document.getElementById("student-input-table")
    $("#delete-meeting-button").prop('disabled',true)
    $("#delete-meeting-button").hide()
    $("#meeting-id-input-field").val("")
    $("#meeting-name-input-field").val("")
    $("#meeting-id-input-field").removeClass("is-invalid")
    $("#meeting-name-input-field").removeClass("is-invalid")
    while(studentInputTable.rows.length !== 0){
        studentInputTable.deleteRow(0)
    }
    rosterParticipantCount = 0
    addStudent()
    document.getElementById("meeting-modal-title").innerHTML = "Add Roster"
}
function addStudent(name){
    rosterParticipantCount += 1
    document.getElementById("roster-participant-count").innerHTML = "Participant Count: " + rosterParticipantCount
    const studentInputTable = document.getElementById("student-input-table")
    let row = studentInputTable.insertRow(studentInputTable.rows.length)
    row.innerHTML = studentTableBlock
    if(name){
        let res = name.split(" ")

        row.cells[0].children[0].value = res[0]
        if(res.length !== 1){
            row.cells[1].children[0].value = res[res.length-1]
        }
       else{
            row.cells[1].children[0].value = ""
        }
    }
    $("input").on("click", function(){
        $(this).removeClass('is-invalid')
    })
    $('.student-name').on('keypress', function(e) {
        if (e.which === 32){
            return false;
        }
    });
    $('.student-name').on('paste', function (event) {
        if (event.originalEvent.clipboardData.getData('Text').match(/[^\w]/)) {
            event.preventDefault();
        }
    });
}
function deleteStudent(e){
    rosterParticipantCount -= 1
    document.getElementById("roster-participant-count").innerHTML = "Participant Count: " + rosterParticipantCount
    const currentRow = e.parentNode.parentNode
    currentRow.parentNode.removeChild(currentRow)
}
function addNotRegisteredUpdate(){
    let meetingIDInputField = $("#meeting-id-input-field")
    let meetingNameInputField = $("#meeting-name-input-field")
    let deleteMeetingButton =  $("#delete-meeting-button")
    meetingIDInputField.prop('disabled',true)
    isEditingMeeting = true
    editingIndex = meetingIndex+1
    document.getElementById("meeting-modal-title").innerHTML = "Update Roster"
    const studentInputTable = document.getElementById("student-input-table")
    deleteMeetingButton.prop('disabled',true)
    deleteMeetingButton.hide()
    meetingIDInputField.val(CurrentMeetingID)
    meetingNameInputField.val(Meetings[meetingIndex].name)
    meetingIDInputField.removeClass("is-invalid")
    meetingNameInputField.removeClass("is-invalid")
    while(studentInputTable.rows.length !== 0){
        studentInputTable.deleteRow(0)
    }
    rosterParticipantCount = 0
    for(let i = 0; i < Participants.length; i++){
        const fullName = Participants[i].firstName + " " + Participants[i].lastName
        addStudent(fullName)
    }
}

function addNotRegisteredCreateAll(){
    addNotRegisteredCreate("all")
}

function addNotRegisteredCreateOnlyNotRegistered(){
    addNotRegisteredCreate("Not Registered")
}

function addNotRegisteredCreate(filter){
    let meetingIDInputField = $("#meeting-id-input-field")
    let meetingNameInputField = $("#meeting-name-input-field")
    let deleteMeetingButton =  $("#delete-meeting-button")
    meetingIDInputField.prop('disabled',true)
    isEditingMeeting = false
    document.getElementById("meeting-modal-title").innerHTML = "Create Roster"
    const studentInputTable = document.getElementById("student-input-table")
    deleteMeetingButton.prop('disabled',true)
    deleteMeetingButton.hide()
    meetingIDInputField.val(CurrentMeetingID)
    meetingNameInputField.val(CurrentMeeting)
    meetingIDInputField.removeClass("is-invalid")
    meetingNameInputField.removeClass("is-invalid")
    while(studentInputTable.rows.length !== 0){
        studentInputTable.deleteRow(0)
    }
    rosterParticipantCount = 0
    for(let i = 0; i < Participants.length; i++){
        if(filter === 'all' || Participants[i].state === filter){
            const fullName = Participants[i].firstName + " " + Participants[i].lastName
            addStudent(fullName)
        }
    }
}


function compareMeetings(a, b) {
    if (a.name > b.name) return 1;
    if (b.name > a.name) return -1;
    if(a.id > b.id) return 1
    if(a.id < b.id) return -1
    return 0;
}
function comparePastMeetings(a, b) {
    if (a.MeetingStart > b.MeetingEnd) return -1
    return 1;
}



$("#records-search-input-field").on('keyup', function (e) {
    const recordTable = document.getElementById("records-table")
    currValue = $(this).val();
    if (e.key === 'Enter' || e.keyCode === 13) {
        $("#records-search-input-field").blur()
    }
    while(recordTable.rows.length > 1){
        recordTable.deleteRow(1)
    }
    for(let i = PastMeetings.length-1; i >= 0; i--){
        const name = PastMeetings[i].MeetingName
        const currentRecordTable = document.getElementById("current-record-table")
        if(name.toLowerCase().includes(currValue.toLowerCase().trim())){
            let currentRow = recordTable.insertRow(1)
            currentRow.addEventListener("click", function () {
                let index = this.rowIndex
                currentRecordIndex = index-1
                const currentMeeting = PastMeetings[index - 1]
                document.getElementById("current-record-name").innerHTML = "Meeting Name: " + currentMeeting.MeetingName
                document.getElementById("current-record-id").innerHTML = "Meeting ID: " + currentMeeting.MeetingID
                document.getElementById("current-record-date").innerHTML = "Date: " + currentMeeting.MeetingStart.toDate().toLocaleString() + " - " + currentMeeting.MeetingEnd.toDate().toLocaleString()
                $('#meeting-record-modal').modal('show');

                while (currentRecordTable.rows.length !== 0) {
                    currentRecordTable.deleteRow(0)
                }
                for (i = 0; i < currentMeeting.events.length; i++) {
                    let row = currentRecordTable.insertRow(currentRecordTable.rows.length)
                    let cell1 = row.insertCell(0)
                    cell1.innerHTML = currentMeeting.events[i]
                }
            })
            let cell1 = currentRow.insertCell(0)
            let cell2 = currentRow.insertCell(1)
            let cell3 = currentRow.insertCell(2)
            currentRow.style.backgroundColor = "#ffffff"
            cell1.innerHTML = PastMeetings[i].MeetingName
            cell2.innerHTML = PastMeetings[i].MeetingID
            cell3.innerHTML = PastMeetings[i].MeetingStart.toDate().toLocaleString()
            cell2.classList.add("meeting-id-text")
            currentRow.classList.add("record-row")
        }
    }

});
$("#current-record-search-input-field").on('keyup', function (e) {
    const currentRecordTable = document.getElementById("current-record-table")
    currValue = $("#current-record-search-input-field").val();
    if (e.key === 'Enter' || e.keyCode === 13) {
        $("#current-record-search-input-field").blur()
    }

    while(currentRecordTable.rows.length > 0){
        currentRecordTable.deleteRow(0)
    }
    for(let i = PastMeetings[currentRecordIndex].events.length-1; i >= 0; i--){
        const currString = CryptoJS.AES.decrypt(PastMeetings[currentRecordIndex].events[i],auth.currentUser.uid).toString(CryptoJS.enc.Utf8);
        if(currString.toLowerCase().includes(currValue.toLowerCase().trim())){
            let row = currentRecordTable.insertRow(0);
            row.style.backgroundColor = "#ffffff"
            row.style.color = "#000000"
            let cell1 = row.insertCell(0)
            cell1.innerHTML = CryptoJS.AES.decrypt(PastMeetings[currentRecordIndex].events[i],auth.currentUser.uid).toString(CryptoJS.enc.Utf8);

        }
    }

});

function deleteRecord(){
    const currentRecord = PastMeetings[currentRecordIndex]
    firestore.collection("Records").doc(currentRecord.docID).delete().then(() => {
        $("#meeting-record-modal").modal("hide")
        greenNotification("Meeting record deleted")
    }).catch((error) => {
        redNotification("Error deleting record")
    });
}
function confirmDeleteAllRecords(){
    let deletionCount = 0
    let PastMeetingsLength = PastMeetings.length
    let PastMeetingIDs = []
    for(let i = 0; i < PastMeetingsLength; i++){
        PastMeetingIDs.push(PastMeetings[i].docID)
    }
    for(let i = 0; i < PastMeetingsLength; i++){
        if(i < PastMeetingsLength){
            firestore.collection("Records").doc(PastMeetingIDs[i]).delete().then(() =>{
                deletionCount += 1
                if(deletionCount === PastMeetingsLength){
                    $("#delete-record-warning-modal").modal("hide")
                    greenNotification("All meeting records deleted")
                }
            }).catch((error) => {
                redNotification("Error deleting records")
                i = PastMeetingsLength
            })
        }
        else{
            break
        }
    }
    $("#delete-record-warning-modal").modal("hide")
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function exportMeetingRecord(){
    const currentRecord = PastMeetings[currentRecordIndex]
    const downloadElement = document.createElement('a')
    let recordDataString = "Event\n"
    const downloadName = currentRecord["MeetingName"] + " - " + currentRecord["MeetingID"] + " - " + currentRecord["MeetingStart"].toDate().toLocaleString()
    const useruid = auth.currentUser.uid
    for (let i = 0; i < currentRecord["events"].length; i++){
        const event = CryptoJS.AES.decrypt(currentRecord["events"][i], useruid).toString(CryptoJS.enc.Utf8);
        recordDataString += event + "\n"
    }
    downloadElement.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(recordDataString))
    downloadElement.setAttribute('download', downloadName);
    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);
}

function deleteMeeting(){
    const currentMeeting = Meetings[editingIndex-1]
    const uid = auth.currentUser.uid
    const currentId = currentMeeting.id
    const currentName = currentMeeting.name
    const reference = uid+currentId+encodeURIComponent(currentName).replace(/\./g, '%2E')
    firestore.collection("Periods").doc(reference).delete().then(() => {
        greenNotification("Roster deleted")
        $("#add-edit-meeting-modal").modal("hide")
    }).catch((error) => {
        redNotification("Error deleting roster")
    });
}
async function deleteMeetingNoNotification(){
    const currentMeeting = Meetings[editingIndex-1]
    const uid = auth.currentUser.uid
    const currentId = currentMeeting.id
    const currentName = currentMeeting.name
    const reference = uid+currentId+encodeURIComponent(currentName).replace(/\./g, '%2E')
    firestore.collection("Periods").doc(reference).delete().then(() => {
    }).catch((error) => {
    });
}


function check(){
    const idInput = document.getElementById("meeting-id-input-field").value
    const nameInput = document.getElementById("meeting-name-input-field").value

    names = []
    let currentName = ""
    let currentCount = 0
    let shouldProceed = true;
    if(idInput === "" || idInput == null){
        document.getElementById("meeting-id-input-field").classList.add("is-invalid")
        shouldProceed = false;
    }
    else{
        document.getElementById("meeting-id-input-field").classList.remove("is-invalid")
    }
    if(nameInput === "" || idInput == null){
        document.getElementById("meeting-name-input-field").classList.add("is-invalid")
        shouldProceed = false;
    }
    else{
        document.getElementById("meeting-name-input-field").classList.remove("is-invalid")
    }
    $('.student-name').each(function(index,data) {
        const value = $(this).val().trim();
        if(currentCount % 2 === 0){
            currentName += value + " "
        }
        else{
            currentName += value
            names.push(CryptoJS.AES.encrypt(currentName, auth.currentUser.uid).toString())
            currentName = ""
        }
        if((value === "" || value == null) && currentCount % 2 === 0){
            this.classList.add("is-invalid")
            shouldProceed = false;
        }
        else{
            this.classList.remove("is-invalid")
        }
        currentCount += 1
    });
    if(!shouldProceed){
        redNotification("Please make sure you fill out all the necessary fields")
    }
    return shouldProceed
}
function checkID(){
    const currID = document.getElementById("meeting-id-input-field").value
    if(currID.length < 9){
        document.getElementById("meeting-id-input-field").classList.add("is-invalid")
        redNotification("Please enter a valid ID")
        return false
    }
    document.getElementById("meeting-id-input-field").classList.remove("is-invalid")
    return true
}

function checkDuplicateName(){
    const meetingName = document.getElementById("meeting-name-input-field").value
    if(!isEditingMeeting){
        for(let i = 0; i < Meetings.length; i++){
            if(Meetings[i].name.trim() === meetingName.trim()){
                return false;
            }
        }
    }
    else{
        for(let i = 0; i < Meetings.length; i++){
            if(Meetings[i].name.trim() === meetingName.trim() && i !== editingIndex-1){
                return false;
            }
        }
    }
    return true
}
function addMeeting(){
    if(check()){
        if(checkID()){
            if(checkDuplicateName()){
                const user = auth.currentUser
                const periodName = document.getElementById("meeting-name-input-field").value
                const meetingId = document.getElementById("meeting-id-input-field").value
                if(periodName.length > 75){
                    redNotification("Please keep your roster name to under 75 characters")
                    document.getElementById("meeting-name-input-field").classList.add("is-invalid")
                }
                else{
                    if(isEditingMeeting){
                        deleteMeeting()
                    }
                    firestore.collection("Periods").doc(user.uid+meetingId+encodeURIComponent(periodName).replace(/\./g, '%2E')).set({
                        useruid : user.uid,
                        periodName : periodName,
                        meetingId : meetingId,
                        studentsNames: names,
                    }).then(() => {
                        $("#add-edit-meeting-modal").modal("hide")
                        greenNotification("Rosters Updated")
                    }).catch((error)=>{
                        redNotification("Sorry, we had some trouble connecting to the server")
                    })
                }
            }
            else{
                redNotification("You already have a roster with same roster name")
                document.getElementById("meeting-name-input-field").classList.add("is-invalid")
            }
        }
    }
}
$('#add-edit-meeting-modal').on('hidden.bs.modal', function () {
    isEditingMeeting = false
    $("#meeting-id-input-field").prop('disabled',false)
    $("#meeting-name-input-field").prop('disabled',false)
})
function logout(){
    auth.signOut().then(r => {
        window.location.href = "/";
    }).catch(err => {redNotification(err.message)});
}
function resetSettingInput(){
    document.getElementById("displayName-input-field").value = ""
    document.getElementById("pass-current-email-input-field").value = ""

}
function saveDisplayName(){
    if(document.getElementById("displayName-input-field").value !== "" && (document.getElementById("displayName-input-field").value.trim()).length < 35){
        auth.currentUser.updateProfile({
            displayName: document.getElementById("displayName-input-field").value.trim()
        }).then(function() {
            firestore.collection("Users").doc(auth.currentUser.uid).set({
                name : document.getElementById("displayName-input-field").value.trim(),
                email : auth.currentUser.email,
            }).then(() => {
                greenNotification("Your name has successfully been changed")
                document.getElementById("user-name").innerHTML = "Welcome " + document.getElementById("displayName-input-field").value
                document.getElementById("displayName-input-field").value = ""
            }).catch((error)=>{
                redNotification(error.message)
            })
        }).catch(function(error) {
            redNotification("Error changing name")
        });
    }
    else if((document.getElementById("displayName-input-field").value.trim()).length >= 35){
        redNotification("Please choose a shorter display name")
    }
    else{
        redNotification("Please make sure you entered in a name")
    }
    $("#settings-modal").modal('hide');
}

function resetPassword(){
    auth.sendPasswordResetEmail(document.getElementById("pass-current-email-input-field").value.trim()).then(function() {
        document.getElementById("pass-current-email-input-field").value = ""
        greenNotification("A password reset email has been sent")
    }).catch(function(error) {
        redNotification("Incorrect email entered")
    });
    $("#settings-modal").modal('hide');
}

function redNotification(message){

    $(".notify").addClass("notify-active-red");
    document.getElementById("notifyType").innerHTML = message

    setTimeout(function(){
        $(".notify").removeClass("notify-active-red");
        document.getElementById("notifyType").innerHTML = ""
    },2000);
}
function greenNotification(message){

    $(".notify").addClass("notify-active-green");
    document.getElementById("notifyType").innerHTML = message

    setTimeout(function(){
        $(".notify").removeClass("notify-active-green");
        document.getElementById("notifyType").innerHTML = ""
    },2000);
}
function yellowNotification(message){
    $(".notify").addClass("notify-active-yellow");
    document.getElementById("notifyType").innerHTML = message

    setTimeout(function(){
        $(".notify").removeClass("notify-active-yellow");
        document.getElementById("notifyType").innerHTML = ""
    },2000);
}
