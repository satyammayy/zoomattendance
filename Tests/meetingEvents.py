'''
 * Copyright (c) 2021 Ease Attendance - Varun Chitturi
'''
import requests
from time import sleep
import names


def startMeeting(meetingName, meetingID, hostID, url):
    payload = "{\r\n  \"event\": \"meeting.started\",\r\n  \"event_ts\": 1234566789900,\r\n  \"payload\": {\r\n    \"account_id\": \"o8KK_AAACq6BBEyA70CA\",\r\n    \"object\": {\r\n      \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\r\n      \"id\": \"" + meetingID + "\",\r\n      \"host_id\": \"" + hostID + "\",\r\n      \"topic\": \"" + meetingName + "\",\r\n      \"type\": 2,\r\n      \"start_time\": \"2019-07-09T17:00:00Z\",\r\n      \"duration\": 60,\r\n      \"timezone\": \"America/Los_Angeles\"\r\n    }\r\n  }\r\n}"
    headers = {
        'authorization': process.env.zoom_verification_token,
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(meetingName + " started")


def endMeeting(meetingName, meetingID, hostID, url):
    payload = "{\n  \"event\": \"meeting.ended\",\n  \"event_ts\": 1234566789900,\n  \"payload\": {\n    \"account_id\": \"o8KK_AAACq6BBEyA70CA\",\n    \"object\": {\n      \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\n      \"id\": \"" + meetingID + "\",\n      \"host_id\": \"" + hostID + "\",\n      \"topic\": \"" + meetingName + "\",\n      \"type\": 2,\n      \"start_time\": \"2019-07-09T17:00:00Z\",\n      \"duration\": 60,\n      \"timezone\": \"America/Los_Angeles\"\n    }\n  }\n}"
    headers = {
        'authorization': process.env.zoom_verification_token,
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(meetingName + " ended")


def addParticipant(participantName, meetingName, meetingID, hostID, email, url):
    payload = "{\n  \"event\": \"meeting.participant_joined\",\n  \"event_ts\": \"long\",\n  \"payload\": {\n    \"account_id\": \"string\",\n    \"object\": {\n      \"id\": \"" + meetingID + "\",\n      \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\n      \"host_id\": \"" + hostID + "\",\n      \"topic\": \"" + meetingName + "\",\n      \"type\": \"2\",\n      \"start_time\": \"string [date-time]\",\n      \"timezone\": \"string\",\n      \"duration\": \"integer\",\n      \"participant\": {\n        \"user_id\": \"11111111\",\n        \"user_name\": \"" + participantName + "\",\n        \"email\": \"" + email + "\",\n        \"id\": \"string\",\n        \"join_time\": \"string [date-time]\"\n      }\n    }\n  }\n}"
    headers = {
        'authorization': process.env.zoom_verification_token,
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(participantName + " added")


def removeParticipant(participantName, meetingName, meetingID, hostID, email, url):
    payload = "{\n    \"event\": \"meeting.participant_left\",\n    \"event_ts\": \"long\",\n    \"payload\": {\n        \"account_id\": \"string\",\n        \"object\": {\n            \"id\": \"" + meetingID + "\",\n            \"uuid\": \"czLF6FFFoQOKgAB99DlDb9g==\",\n            \"host_id\": \"" + hostID + "\",\n            \"topic\": \"" + meetingName + "\",\n            \"type\": \"2\",\n            \"start_time\": \"string [date-time]\",\n            \"timezone\": \"string\",\n            \"duration\": \"integer\",\n            \"participant\": {\n                \"user_id\": \"11111111\",\n                \"user_name\": \"" + participantName + "\",\n                \"email\": \"" + email + "\",\n                \"id\": \"string\",\n                \"join_time\": \"string [date-time]\"\n            }\n        }\n    }\n}"
    headers = {
        'authorization': process.env.zoom_verification_token,
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(participantName + " removed")


urlactual = "https://www.easeattendance.com/api/requests"
urltest = "http://localhost:4000/api/requests"

ulr = ''

VarunHostID = "hIk5FOWfR-SFE9DgN-2N2w"
AdityaHostID = "TbQ_nGjpR9aMPQnS-IkQPQ"

HostID = ''

meetingID = "7378583629"
meetingName = "Period 3"

participants = []

if input("who dis?(v/a) ") == "v":
    HostID = VarunHostID
    print("Hello Varun")
else:
    HostID = AdityaHostID
    print("Hello Dad")

print()

if input("would you like to send the webhook to easeattendance.com or localhost:4000?(e/l)") == "e":
    url = urlactual
    print("will send webhook to https://www.easeattendance.com/api/requests")
else:
    url = urltest
    print("will send webhook to http://localhost:4000/api/requests")
print()

print("the default meetingID   = " + meetingID)
if input("would you like to change this? (y/n) ") == "y":
    meetingID = input("what would you like to change this to? ")
print()

print("the default meetingName = " + meetingName)
if input("would you like to change this? (y/n) ") == "y":
    meetingName = input("what would you like to change this to? ")
print()

temp = input("would you like to use a predefined participant list(p), create a randomly generated(r) or make your "
             "own(o)? (p/r/o) ")
if temp == "o":
    participants.clear()
    size = int(input("how big is your custom? "))
    for x in range(size):
        nex = input("gimme the number " + str(x) + " participant's full name: ")
        participants.append(nex)

if temp == "r":
    size = int(input("how many random participant full names would you like? "))
    participants.clear()
    for x in range(size):
        participants.append(names.get_full_name())

print("your participant list is " + str(participants))
print()

print("the order of operations is the order in which meeting will start/end, or participants will join/leave")
print("ms stands for meeting started. me for meeting ended. pj for participants join, and pl for leave")
print("for example, entering \"ms pj pl pj me\" will cause a meeting start webhook, then all participants join, "
      "then leave, then rejoin, then the meeting will end")
orderOperations = input("what order of operations would you like(enter space-separated format)? ")
print()
sleepTimeBetweenOperations = float(input("enter the time this test should wait in between operations, for example "
                                         "between starting a meeting and beginning to add participants, or between "
                                         "finishing adding participants and removing them: "))
print()
sleepTimeParts = float(input("would you like a sleep time between each participant join or left? enter the length of "
                             "the sleep between each participant join/left in seconds here: "))
print()
print("starting...")
print()

OrderOperationsArray = orderOperations.split()

print(OrderOperationsArray)

for x in OrderOperationsArray:
    if x == "ms":
        startMeeting(meetingName, meetingID, HostID, url)
    if x == "me":
        endMeeting(meetingName, meetingID, HostID, url)
    if x == "pj":
        for name in participants:
            addParticipant(name, meetingName, meetingID, HostID, name + '@gmail.com', url)
            sleep(sleepTimeParts)
    if x == 'pl':
        for name in participants:
            removeParticipant(name, meetingName, meetingID, HostID, name + '@gmail.com', url)
            sleep(sleepTimeParts)
    print()
    print()
    print(x + " operation completed")
    print()
    print()
    sleep(sleepTimeBetweenOperations)
