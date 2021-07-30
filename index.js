/*
    * Copyright (c) 2021 Ease Attendance - Varun Chitturi
*/
var email = require("./email.js").email
console.log("email html loaded")
const port = process.env.PORT || 4000
console.log("port selected = " + port)
require('dotenv').config()
console.log(".env vars loaded")
const express = require('express')
console.log("express loaded")
const bodyParser = require('body-parser')
console.log("body-parser loaded")
const request = require('request')
console.log("request loaded")
const path = require('path')
console.log("path loaded")
const app = express()
console.log("app created from express")
const admin = require('firebase-admin')
console.log("firebase admin loaded")
const nodemailer = require("nodemailer")
console.log("email client loaded for support")
const favicon = require('serve-favicon')
console.log("favicon loaded")
const CryptoJS = require("crypto-js")
console.log("Encryption module loaded")
// Initialize admin credentials for db
admin.initializeApp({
  credential: admin.credential.cert({
          "type": "service_account",
          "project_id": "easeattendance-c68ed",
          "private_key_id": process.env.firebase_admin_key_id,
          "private_key": process.env.firebase_admin_key,
          "client_email": "easeattendance-c68ed@appspot.gserviceaccount.com",
          "client_id": process.env.firebase_admin_client_id,
          "auth_uri": "https://accounts.google.com/o/oauth2/auth",
          "token_uri": "https://oauth2.googleapis.com/token",
          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
          "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/easeattendance-c68ed%40appspot.gserviceaccount.com"
      }
  )
})
console.log("admin app initialized")
// Create connection to cloud firestore
const db = admin.firestore();
console.log("cloud firestore initialized")
// initialize firestore auth
const auth = admin.auth()
console.log("firestore auth initialized")
console.log("dictionary of current meetings created")
// Initialize nodemailer to send messages for support
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.admin_email,
    pass: process.env.admin_pass
  }
});
console.log("nodemailer transport initialized")
// Initialize app config

app.use(favicon(path.join(__dirname, 'favicon.ico')))
console.log("favicon initialized")
app.use(express.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));
console.log("express app preferences loaded")
// Initialize URL paths

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
})
app.get('/features', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/features.html'));
})

app.get('/about-us', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/about-us.html'));
})

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/privacy.html'));
})

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/terms.html'));
})

app.get('/documentation', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/documentation.html'));
})
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/dashboard.html'));
})
app.get('/forgotpass', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/forgotpass.html'));
})
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'));
})
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/signup.html'));
})
app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/support.html'));
})
app.get('/authorize', (req, res) => {
    const authorizationCode = req.query.code
    console.log(authorizationCode)
    if(authorizationCode && authorizationCode !== ""){
        try{
            request({
                url: 'https://zoom.us/oauth/token?grant_type=authorization_code&' + 'code=' + authorizationCode + '&redirect_uri=https://www.easeattendance.com/authorize',
                method: 'POST',
                json: true,
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64')
                }
            }, (error, httpResponse, body) => {
                if (error) {
                    console.error(error)
                    res.sendFile(path.join(__dirname + '/public/index.html'));
                } else {
                    const accessToken = body.access_token
                    const refreshToken = body.refresh_token

                    request({
                        url: 'https://api.zoom.us/v2/users/me',
                        method: 'GET',
                        json: true,
                        headers: {
                            'Authorization': "Bearer " + accessToken
                        }
                    }, (error, httpResponse, body) => {
                        if (error) {
                            console.error(error)
                            res.sendFile(path.join(__dirname + '/public/index.html'));
                        } else {
                            const userID = body.id
                            const userFirstName = body.first_name
                            const userLastName = body.last_name
                            const userEmail = body.email
                            const userAccountID = body.account_id
                            if(userID && userID !== ""){
                                db.collection("ZoomOAuth").doc(userID).set({
                                    userID: userID,
                                    firstName: userFirstName,
                                    lastName: userLastName,
                                    email: userEmail,
                                    userAccountID: userAccountID,
                                    refreshToken: refreshToken
                                }, {merge: true}).then(() => {
                                    console.info("User " + userFirstName + " " + userLastName + " with email " + userEmail + " has downloaded the Ease Attendance app")
                                    res.sendFile(path.join(__dirname + '/public/signup.html'));
                                }).catch((error) => {
                                    console.error(error.message)
                                    res.sendFile(path.join(__dirname + '/public/index.html'));
                                })
                            }
                            else{
                                res.sendFile(path.join(__dirname + '/public/index.html'));
                            }

                        }
                    })
                }
            })

        }
        catch(error){
            console.error(error.message)
            res.sendFile(path.join(__dirname + '/public/index.html'));
        }
    }
    else{
        res.sendFile(path.join(__dirname + '/public/index.html'));
    }
})
app.get('/zoomverify/verifyzoom.html', (req, res) => {
    res.send(process.env.zoom_verification_code)
})

// function to send messages for https://www.easeattendance.com/support
app.post('/support-message', (req,res) => {
  const message = "email from: " + req.body.email + " with name: " + req.body.Name + " with message: " + req.body.message
  var mailOptions = {
    from: process.env.admin_email,
    to: process.env.admin_email,
    subject: 'Support Email from Ease Attendance: ' + req.body.email,
    text: message
  };
  var mailOptionsUser = {
    from: process.env.admin_email,
    to: req.body.email,
    subject: "Ease Attendance Support",
    html: email
  };
  if(req.body.email){
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.error(error);
      } else {
        console.info('Email sent: ' + info.response);
      }
    });
    transporter.sendMail(mailOptionsUser, function(error, info){
      if (error) {
        console.error(error);
      } else {
        console.info('Email sent: ' + info.response);
      }
    });
  }
  res.status(200);
  res.send()
})

function updateParticipants(host_id, messageString, recordString,hostUID){
    messageString += addTime()
    db.collection("CurrentMeetings").doc(host_id).update({
        messageLog: admin.firestore.FieldValue.arrayUnion(CryptoJS.AES.encrypt(messageString,hostUID).toString()),
        recordLog: admin.firestore.FieldValue.arrayUnion(CryptoJS.AES.encrypt(recordString,hostUID).toString())
    }).then().catch((error)=>{
        console.error(error.message)
    })
}
function addTime(){
    var today = new Date(); // adds time in ISO format to message string
    return " "+today.toISOString()
}

if(port !== 4000){
    db.collection("UpdateBrowser").doc("updateDate").get().then((doc)=>{
        let dbDate = doc.data().date;
        let currentDate = new Date();
        dbDate = dbDate.toDate()
        if(currentDate.getTime() - dbDate.getTime() >= 30000){
            db.collection("UpdateBrowser").doc("updateDate").set({
                date: new Date()
            }).then().catch(()=>{
                console.error("error setting updateDate doc to update client end")
            })
        }
    }).catch((error)=>{
        console.error(error.message)
    })
}

function updateStartMeeting(body,host_id){
    db.collection("ZoomOAuth").doc(host_id).get().then((doc)=>{
        let currentDate = new Date()
        let currRecordLog = []
        let currMessageLog = []
        let recordString = "Meeting: " + body.payload.object.topic + " has started " + "with ID: " + body.payload.object.id + "  " + currentDate
        let messageStringID = "meeting.id " + body.payload.object.id
        let messageStringStart = "meeting.started " + body.payload.object.topic
        currRecordLog.push(CryptoJS.AES.encrypt(recordString,doc.data().firebaseID).toString())
        currMessageLog.push(CryptoJS.AES.encrypt(messageStringID,doc.data().firebaseID).toString())
        currMessageLog.push(CryptoJS.AES.encrypt(messageStringStart,doc.data().firebaseID).toString())
        db.collection("CurrentMeetings").doc(host_id).set({
            meetingID: body.payload.object.id,
            hostID: host_id,
            meetingName: body.payload.object.topic,
            hostEmail: doc.data().email,
            hostUID: doc.data().firebaseID,
            messageLog: currMessageLog,
            recordLog: currRecordLog,
            meetingStart: currentDate,
            uuid: body.payload.object.uuid
        }).then(() => {
        }).catch(()=>{
            console.error("Error creating doc in CurrentMeetings for meeting start")
        })
        console.log("Meeting started: " + body.payload.object.topic)
    }).catch((error)=>{
        console.error(error.message)
    })
}

app.post('/api/requests', (req, res) => {
    res.status(200)
    res.send()
    console.log("post request to /api/requests sent ")
    console.log(req.body)
    console.log(req.headers.authorization)
    if(req && req.headers && (req.headers.authorization === process.env.zoom_verification_token)){
        const body = req.body
        const host_id = body.payload.object.host_id
        if(body.event === "meeting.started" || body.event === "webinar.started"){
            db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc)=>{
                if(!meetingDoc.exists){
                    updateStartMeeting(body,host_id);
                }
                else{
                    let tryCounterA = 0
                    let tryStartMeetingInterval = setInterval(() => {
                        db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc2) =>{
                            if(!meetingDoc2.exists){
                                clearInterval(tryStartMeetingInterval)
                                updateStartMeeting(body,host_id);
                            }
                            else{
                                tryCounterA += 1
                            }
                            if(tryCounterA >= 10){
                                clearInterval(tryStartMeetingInterval)
                                updateStartMeeting(body,host_id)
                            }
                        }).catch((error)=>{
                            console.error(error.message)
                        })
                    },3000)
                }
            }).catch((error)=>{
                console.error(error.message)
            })
        }
        else if(body.event === "meeting.participant_joined" || body.event === "webinar.participant_joined"){
            const participant = body.payload.object.participant
            const participantName = participant.user_name
            let participantEmail = participant.email
            if(participantEmail === "" || participantEmail == null){
                participantEmail = participant.user_name.replace(/\s/g, '#%^()!!');
            }
            console.log("Participant " + participantName + " has joined")
            db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc) =>{
                if(meetingDoc.exists && meetingDoc.data().uuid === body.payload.object.uuid){
                    let currentDate = new Date()
                    let recordString = participantName +  " has joined" + "  " + currentDate
                    let messageString = "participant.joined " + participantName + " " + participantEmail
                    updateParticipants(host_id, messageString, recordString,meetingDoc.data().hostUID)
                }
                else{
                    let tryCounterB = 0
                    let tryJoinParticipantInterval = setInterval(() => {
                        db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc2)=>{
                            if(meetingDoc2.exists && meetingDoc2.data().uuid === body.payload.object.uuid){
                                let currentDate = new Date()
                                let recordString = participantName +  " has joined" + "  " + currentDate
                                let messageString = "participant.joined " + participantName + " " + participantEmail
                                updateParticipants(host_id, messageString, recordString,meetingDoc2.data().hostUID)
                                clearInterval(tryJoinParticipantInterval)
                            }
                            else{
                                tryCounterB += 1
                            }
                            if(tryCounterB >= 10){
                                clearInterval(tryJoinParticipantInterval)
                            }
                        }).catch((error)=>{
                            console.error(error.message)
                        })
                    },3000)
                }
            }).catch((error)=>{
                console.error(error.message)
            })
        }
        else if(body.event === "meeting.participant_left" || body.event === "webinar.participant_left"){
            const participant = body.payload.object.participant
            const participantID = participant.id
            const participantName = participant.user_name
            let participantEmail = participant.email
            if(participantEmail === "" || participantEmail == null){
                participantEmail = participant.user_name.replace(/\s/g, '#%^()!!');
            }
            console.log("Participant " + participantName + " has left")
            db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc)=>{
                if(meetingDoc.exists && meetingDoc.data().uuid === body.payload.object.uuid){
                    let currentDate = new Date()
                    let recordString = participantName +  " has left" + "  " + currentDate
                    let messageString = "participant.left " + participantName + " " + participantEmail
                    updateParticipants(host_id, messageString, recordString,meetingDoc.data().hostUID)
                }
                else{
                    let tryCounterC = 0
                    let tryLeaveParticipantInterval = setInterval(()=>{
                        db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc2) =>{
                            if(meetingDoc2.exists && meetingDoc2.data().uuid === body.payload.object.uuid){
                                clearInterval(tryLeaveParticipantInterval)
                                let currentDate = new Date()
                                let recordString = participantName +  " has left" + "  " + currentDate
                                let messageString = "participant.left " + participantName + " " + participantEmail
                                updateParticipants(host_id, messageString, recordString,meetingDoc2.data().hostUID)
                                clearInterval(tryLeaveParticipantInterval)
                            }
                            else{
                                tryCounterC += 1
                            }
                            if(tryCounterC >= 10){
                                clearInterval(tryLeaveParticipantInterval)
                            }

                        }).catch((error)=>{
                            console.error(error.message)
                        })
                    },3000)
                }
            }).catch((error)=>{
                console.error(error.message)
            })
        }
        else if(body.event === "meeting.ended" || body.event === "webinar.ended"){
            console.log("Meeting ended: " + body.payload.object.topic)
            db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc) =>{
                if(meetingDoc.exists){
                    let meetingDocData = meetingDoc.data()
                    let currentDate = new Date()
                    let currentMessages = meetingDocData.messageLog
                    currentMessages.push(CryptoJS.AES.encrypt("meeting.ended",meetingDocData.hostUID).toString())
                    let currentRecords = meetingDocData.recordLog
                    let recordString = "Meeting: " + body.payload.object.topic + " has ended " + "with ID: " + body.payload.object.id + "  " + currentDate
                    currentRecords.push(CryptoJS.AES.encrypt(recordString,meetingDocData.hostUID).toString())
                    let meetingID = meetingDocData.meetingID
                    let hostUID = meetingDocData.hostUID
                    let meetingName = meetingDocData.meetingName
                    let meetingStart = meetingDocData.meetingStart
                    let uuid = body.payload.object.uuid
                    db.collection("Records").add({
                        'Events': currentRecords,
                        'MeetingID': meetingID,
                        'useruid': hostUID,
                        'MeetingName': meetingName,
                        'MeetingStart': meetingStart,
                        'MeetingEnd' : new Date()
                    })
                    .then(() => {})
                    .catch((error) => {
                        console.error(error.message);
                    });
                    if(uuid === meetingDocData.uuid){
                        db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc2)=>{
                            if(meetingDoc2.exists && meetingDoc2.data().uuid === uuid){
                                db.collection("CurrentMeetings").doc(host_id).delete().then(()=>{
                                }).catch((error)=>{
                                    console.error(error.message)
                                })
                            }
                        }).catch((error)=>{
                            console.error(error.message)
                        })
                    }
                    else{
                        let tryCounterD = 0
                        let tryEndMeetingInterval = setInterval(()=>{
                            db.collection("CurrentMeetings").doc(host_id).get().then((meetingDoc2)=>{
                                if(meetingDoc2.exists && meetingDoc2.data().uuid === uuid){
                                    clearInterval(tryEndMeetingInterval)
                                    db.collection("CurrentMeetings").doc(host_id).delete().then(()=>{
                                    }).catch((error)=>{
                                        console.error(error.message)
                                    })
                                }
                                else{
                                    tryCounterD += 1
                                }
                                if(tryCounterD >= 10){
                                    clearInterval(tryEndMeetingInterval)
                                }
                            }).catch((error)=>{
                                console.error(error.message)
                            })
                        },3000)
                    }
                }
            }).catch((error)=>{
                console.error(error.message)
            })
        }
    }
})

app.post('/deauthorize', (req, res) => {
  if (req.headers.authorization === process.env.zoom_verification_token) {
    console.log("post request to /deauthorize received " + req.body)
    console.log(req.body)
    res.status(200)
    res.send()
    request({
      url: 'https://api.zoom.us/oauth/data/compliance',
      method: 'POST',
      json: true,
      body: {
        'client_id': req.body.payload.client_id,
        'user_id': req.body.payload.user_id,
        'account_id': req.body.payload.account_id,
        'deauthorization_event_received': req.body.payload,
        'compliance_completed': true
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.zoom_client_id + ':' + process.env.zoom_client_secret).toString('base64'),
        'cache-control': 'no-cache'
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.error(error)
      } else {
          const userID = req.body.payload.user_id
          db.collection("ZoomOAuth").doc(userID).get().then((Authdoc) => {
              if(Authdoc.exists){
                  const email = Authdoc.data().email
                  db.collection("ZoomOAuth").doc(userID).delete().then(()=>{
                      console.info("Zoom auth info for user with email: " + email + " deleted")
                  }).catch((error) => {
                      console.error(error.message)
                  })
                  db.collection("Users").where("email", "==",email).get().then((querySnapshot) => {
                      querySnapshot.forEach((Userdoc) => {
                          const firebaseUserID = Userdoc.id
                          auth.deleteUser(firebaseUserID).then(() => {
                              console.info("User deleted from firebase auth for user with email: " + email + " and firebase id: " + firebaseUserID)
                          }).catch((error) => {
                              console.error(error.message)
                          })
                          db.collection("CurrentMeetings").doc(userID).get().then((doc)=>{
                              db.collection("CurrentMeetings").doc(userID).delete().then(() => {
                                  console.log("Meetings deleted for user with useruid " + firebaseUserID)
                              }).catch(() => {
                                  console.error("Error deleting meeting for user with uid " + firebaseUserID)
                              })
                          }).catch((error)=>{
                              console.error(error.message)
                          })
                          db.collection("Periods").where("useruid", "==", firebaseUserID).get().then((querySnapshot) => {
                              querySnapshot.forEach((Perioddoc) => {
                                  db.collection("Periods").doc(Perioddoc.id).delete().then(()=> {
                                      console.log("Period deleted for user with email: " + email + " with firebase id: " + firebaseUserID)
                                  }).catch((error) => {
                                      console.error(error.message)
                                  })
                              })
                          }).catch((error) => {
                              console.error(error.message)
                          })
                          db.collection("Records").where("useruid","==",firebaseUserID).get().then((querySnapshot) => {
                              querySnapshot.forEach((Recorddoc) => {
                                  db.collection("Records").doc(Recorddoc.id).delete().then(() => {
                                      db.collection("ZoomOAuth").doc(userID).delete().then(() => {
                                          console.log("Record deleted for user with email: " + email + " with firebase id: " + firebaseUserID)
                                      }).catch((error) => {
                                          console.error(error.message)
                                      })
                                  }).catch((error) => {
                                      console.error(error.message)
                                  })
                              })
                          }).catch((error) => {
                              console.error(error.message)
                          })
                          db.collection("Users").doc(firebaseUserID).delete().then(() => {
                          }).catch((error) => {
                              console.error(error.message)
                          })
                      })
                  }).catch((error) => {
                      console.error(error.message)
                  })
              }
          }).catch((error) => {
              console.error(error.message)
          })
      }
    })

  } else {
    res.status(401)
    res.send()
  }
})


const server = app.listen(port, () => console.log(`Ease Attendance running on server on ${port}!`))
