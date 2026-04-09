'use strict'
const fs = require('fs');
const LOGFILE = "chatlog.json"


var WebSocketClient = require('websocket').client


/**
 * a simple bot class. It connects to the server and reacts to messages.
 * The bot is build to react to messages with a simple keyword matching. 
 * The keywords and answers are stored in the json file minecraft_biomes.json.
 * You can change the json file and add your own keywords and answers. 
 * The bot reacts to the first keyword it finds, so be careful with the order of the keywords.
 */

class bot {

  /**
   * constructor. Initializes the bot, loads the json files and sets up the websocket connection.
   */
  constructor () {
    
    
    
    this.chatBot = require("./json/minecraft_biomes.json")
    this.hello = require("./json/hello.json")
    this.needHelp = require("./json/needHelp.json")
    this.no = require("./json/no.json")
    this.yes = require("./json/yes.json")
    this.dAnswer = require("./json/defaultAnswer.json")
    this.understood = require("./json/understood.json")
    this.sender=""
    

   
    //websocket connection
    this.client = new WebSocketClient()
    
    //true when the bot is connected to the server, false otherwise
    this.connected = false

    
    //if the connection fails, we log the error
    this.client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString())
    })

     
      //client connected to server 
      this.client.on('connect', function (connection) {
      this.con = connection
      console.log('WebSocket Client Connected')
      connection.on('error', function (error) {
      console.log('Connection Error: ' + error.toString())
      })

      //if the connection is closed, we log it
      connection.on('close', function () {
      console.log('echo-protocol Connection Closed')
      })

      
      //if a message is received, we log it and react to it 
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          var data = JSON.parse(message.utf8Data)
          console.log('Received: ' + data.msg + ' ' + data.name)
        }
      })
       
      //send a message to the server to join the chat with the name "Steve"
      function joinGesp () {
        if (connection.connected) {
          connection.sendUTF('{"type": "join", "name":"Steve"}')
        }
      }
      
      joinGesp()
    })
  }

   //connects the bot to the server
  connect () {
    this.client.connect('ws://127.0.0.1:10000/', 'chat')
    this.connected = true
  }

  /** 
   * reacts to a message. The bot checks if the message contains a keyword and reacts with the corresponding answer.
   * @param msg message the bot reacts to
  */
  post (msg) {
    var get=JSON.parse(msg);
    var nachricht = get.msg.toLowerCase();
    var name = 'Steve'
    this.botName = name
    var inhalt = ''
    this.sender=get.name
    var defaultAnswer = this.randomIndex(this.dAnswer)  //the default Answer
    var understood = this.randomIndex(this.understood)

    //save the message of the user in the json file
    this.saveChatMessageUser(this.sender, nachricht)

    //checks if the user wants to continue the action, if there is a question and the user says no, 
    // it resets the question and intent
    if (this.readQuestion(this.sender) != "" && this.dontContinue(nachricht)){
      var questionAsked = true;
      this.saveQuestion("", this.sender)
      this.saveIntent([], this.sender)
      this.saveSelection("", this.sender)
      inhalt = understood + " "
      this.saveBiomeId(0, this.sender)
    }

    //checks if there was an intent the user wants to continue
    if (this.readIntent(this.sender).length != 0){
      inhalt = this.runThroughList(this.readIntent(this.sender), nachricht, defaultAnswer)
      if (inhalt == defaultAnswer){
        inhalt += " " +  this.randomIndex(this.readQuestion(this.sender)) + " " + this.randomIndex(this.readSelection(this.sender))
        this.changeFallBackCounter(this.sender, false)
      }
    } else {
      //checks the whole json file for keywords and reacts with the corresponding answer
      inhalt += this.runThroughList(this.chatBot.answers, nachricht, defaultAnswer)
    }

    if (questionAsked && inhalt == understood + " " + defaultAnswer){
      inhalt = understood + " " + this.randomIndex(this.needHelp)
      this.changeFallBackCounter(this.sender, false)
    }

    //Hard Fallback -> if the bot does not understand the user 3 times in a row, it resets everything and starts over
    if (inhalt == defaultAnswer){
      this.changeFallBackCounter(this.sender, false)
    }
    if (this.readFallBackCounter(this.sender) == 3){
      inhalt = "Da ich dich nun mehrfach nicht verstanden habe fangen wir von vorne an. " + this.randomIndex(this.needHelp)
      this.saveIntent([], this.sender)
      this.saveQuestion("", this.sender)
      this.changeFallBackCounter(this.sender, true)
      this.saveSelection("", this.sender)
      this.saveBiomeId(0, this.sender)
    }

    this.saveChatMessageBot(this.sender, inhalt)

    //processing the message and sending it to the server
    var msg = JSON.stringify({type: "msg", name: name, msg: inhalt, sender: this.sender, biomeId: this.readBiomeId(this.sender)});
    console.log('Send: ' + msg)
    this.client.con.sendUTF(msg)
  }

  //runs through a list of keywords
  runThroughList (list, nachricht, defaultAnswer) {
  var inhalt = defaultAnswer
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < list[i].intent.length; j++) {
      //if the message contains a keyword, the bot reacts with the corresponding answer and saves the intent and question for further use
      if (nachricht.includes(list[i].intent[j])) { 
        if (list[i].list) {
          //recursive call to run through the list of keywords, if there is a sublist
          this.saveIntent(list[i].list, this.sender)
          this.saveQuestion(list[i].question, this.sender)
          this.saveSelection(this.randomIndex(list[i].selection), this.sender)
          if (list[i].id){
            this.saveBiomeId(Number(list[i].id), this.sender)
          }
          inhalt = this.runThroughList(list[i].list, nachricht, defaultAnswer) 
        } else {
          this.saveIntent([], this.sender)
          this.saveQuestion("", this.sender)
        }
        //if no other answer was found, the bot reacts with the default answer, otherwise with the corresponding answer
        if (inhalt == defaultAnswer){
          inhalt = this.randomIndex(list[i].answer)
          }  
        this.changeFallBackCounter(this.sender, true)
        return inhalt
      }
    }
  }
  return inhalt
}


  //if there are multiple answers for a keyword, the bot reacts with a random answer from the list
  randomIndex(array){
    if (Array.isArray(array)){
      return array[Math.floor(Math.random()*array.length)]
    } else {
      return array
    }
  }

  //Checkts if the User dont wants to continue the action
  dontContinue(nachricht){
    for (var i = 0; i < this.no.length; i++){
      if (nachricht.includes(this.no[i])){
        return true
      }
    }
    return false
  }

  //Checkts if the User wants to continue the action
  continue(nachricht){
    for (var i = 0; i < this.yes.length; i++){
      if (nachricht.includes(this.yes[i])){
        return true
      }
    }
    return false
  }

  //Saves the message of the user in the json file. 
  //If the user is not in the json file, it creates a new entry for the user.
  saveChatMessageUser(sender, nachricht) {
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)
    if (!user) {
      //if not found: create new entry
      user = {
        username: sender,
        currentIntent: [],
        currentBiomeId: 0,
        currentQuestion: "",
        currentSelection: "",
        fallBackCounter: 0,
        chathistory: []
      };
      data.users.push(user)
    }

    //save the message in the chathistory array
    user.chathistory.push({
      sender: sender,
      message: nachricht,
      timestamp: new Date().toISOString()
    });

    //write everything back to the file
    fs.writeFileSync(LOGFILE, JSON.stringify(data, null, 2), 'utf8')
  }

  //Saves the message of the bot in the json file.
  saveChatMessageBot(sender, nachricht) {
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)
    if (!user) {
      //if not found: create new entry
      user = {
        username: sender,
        currentIntent: [],
        currentBiomeId: 0,
        currentQuestion: "",
        currentSelection: "",
        fallBackCounter: 0,
        chathistory: []
      };
      data.users.push(user)
    }

    //save the message in the chathistory array
    user.chathistory.push({
      sender: this.botName,
      message: nachricht,
      timestamp: new Date().toISOString()
    });

    //write everything back to the file
    fs.writeFileSync(LOGFILE, JSON.stringify(data, null, 2), 'utf8')
  }

  //Saves the current intent of the user in the json file.
  saveIntent(currentIntent, sender){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    user.currentIntent = currentIntent

    //write everything back to the file
    fs.writeFileSync(LOGFILE, JSON.stringify(data, null, 2), 'utf8')
  }

  //Reads the current intent of the user from the json file.
  readIntent(sender){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender);

    return user.currentIntent
  }

  //saves the current question of the user in the json file.
  saveQuestion(currentQuestion, sender){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender);

    user.currentQuestion = currentQuestion

    //write everything back to the file
    fs.writeFileSync(LOGFILE, JSON.stringify(data, null, 2), 'utf8')
  }

  //reads the current question of the user from the json file.
  readQuestion(sender){
    //load or initialize the file
    let data = { users: [] };
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'));
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    return user.currentQuestion
  }

  saveSelection(currentSelection, sender){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    user.currentSelection = currentSelection

    //write everything back to the file
    fs.writeFileSync(LOGFILE, JSON.stringify(data, null, 2), 'utf8')
  }

  readSelection(sender){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    return user.currentSelection
  }

  changeFallBackCounter(sender, reset){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    if (reset == false){
      user.fallBackCounter++
    } else {
      user.fallBackCounter = 0
    }
    
    //write everything back to the file
    fs.writeFileSync(LOGFILE, JSON.stringify(data, null, 2), 'utf8')
  }

  readFallBackCounter(sender){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    return user.fallBackCounter
  }

  //reads the current biome ID of the user from the json file.
  readBiomeId(sender){
    //load or initialize the file
    let data = { users: [] };
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'));
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    return user.currentBiomeId
  }

  saveBiomeId(currentBiomeId, sender){
    //load or initialize the file
    let data = { users: [] }
    if (fs.existsSync(LOGFILE)) {
      data = JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
    }

    //search for the user
    let user = data.users.find(u => u.username === sender)

    user.currentBiomeId = currentBiomeId

    //write everything back to the file
    fs.writeFileSync(LOGFILE, JSON.stringify(data, null, 2), 'utf8')
  }

}



module.exports = bot
