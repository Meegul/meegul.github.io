var histNum = 0; //Total number of history elements.
var topDir = ""; //Top of the dirStack.
var dirStack = ['/']; //Stack of current directory chain.
var commandNum = 0; //Total number of commands.
var commandStack = []; //Remembers previous commands.
var lookingAtCommand = 0; //Command index that is currently in the input.
var currentCommand = ""; //Saves a command that has not been entered yet when going through the history/
var fileStructure = new Object();
fileStructure['/'] = new Object();


document.onclick = function() {
    document.getElementById("input").focus();
}

document.getElementById("input").onkeydown = function(event) {
    var input = document.getElementById("input");
    switch (event.keyCode) {
        case 13:
            enter(input);
            break;
        case 38:
            upKey();
            break;
        case 40:
            downKey();
            break;
        default:
            break;
    }
}

/**
 * Handles what happens when the enter key is pressed.
 * Doesn't return anything.
 */

function enter(input) {
    commandNum++;
    lookingAtCommand = commandNum; //Set in order to both reset what part of the history we are looking at and increase to new max.
    commandStack.push(input.value); //Pushes current command to the command stack.
    addHistory(input.value); //Adds the inputted command to the history in the DOM.
    var result = parseInput(input.value); //Executes command, if possible
    addHistory(result); //Adds result of command to history in the DOM, if one is given.
}

function upKey() {
    if (lookingAtCommand > 0) {
        if (lookingAtCommand === commandNum) {
            currentCommand = input.value;
        }
        lookingAtCommand--;
        input.value = commandStack[lookingAtCommand];
    }
}

function downKey() {
    if (lookingAtCommand < commandNum - 1) {
        lookingAtCommand++;
        input.value = commandStack[lookingAtCommand];
    } else if (lookingAtCommand === commandNum - 1) { //We can assume that if this is ever true, that the user has hit the up key before, meaning we have a command saved to restore.
        lookingAtCommand++;                           //If that's not true... well, that's quite a shame.
        input.value = currentCommand;
    }
}

/**
 * Method to parse input after enter key is pressed.
 * Returns what is to be printed after the directory.
 * Only accepts valid commands.
 */

function parseInput(input) {
    var inArr = input.split(" ");
    switch (inArr[0]) {
        case 'cd':
            return cd(inArr[1]);
        case 'pwd':
            return oneLine(pwd());
        case 'ls':
            return ls(inArr[1]);
        case 'mkdir':
            return mkdir(inArr[1]);
        default:
            return oneLine('Command not found: ' + input.split(' ')[0]);
    }
}

/**
 * Creates a new history item that is only one line with the message passed.
 * DOES include the current top directory in the output.
 */

function addHistory(result) {
    var history = document.getElementById("history");
    var newParent = document.createElement("div");
    var newChild = document.createElement("p");
    var input = document.getElementById("input");
    if (dirStack.slice(-1)[0] === undefined)
        newChild.innerHTML = '/' + " " + result;
    else
        newChild.innerHTML = dirStack.slice(-1)[0] + " " + result;
    if (result != input.value) {
        clearInput();
    }
    if (result != "nonono") {
        newParent.id = "his" + histNum++;
        newParent.appendChild(newChild);
        history.appendChild(newParent);
    }
    window.scrollTo(0,document.body.scrollHeight);
}

function clearInput() {
    var input = document.getElementById("input");
    input.value = "";
}

function cd(input) {
    var fullDir = pwd();
    var lookingAt = fileStructure['/'];
    fullDir.split('/').forEach(function(element) {
        if (lookingAt[element] != undefined)
            lookingAt = lookingAt[element];
    }, this);
    if (input === '..') {
        if (dirStack.slice(-1)[0] != dirStack[0]) { //Ensures user does not navigate past root directory.
            dirStack.pop();
            document.getElementById("headInfo").innerHTML = dirStack.slice(-1)[0];
        } else {
            clearInput();
        }
    } else if(input === '/') {
        dirStack = ['/'];
        document.getElementById("headInfo").innerHTML = dirStack.slice(-1)[0];
    }
        else if (lookingAt[input] != undefined){
        dirStack.push(input);
        document.getElementById("headInfo").innerHTML = dirStack.slice(-1)[0];
    } else {
        oneLine("cd: No such file or directory: " + input);
    }
    return("nonono"); //Returns this value to signify that this command has no output.
}

function pwd() {
    return '/' + dirStack.slice(1).join('/');
}

function ls() {
    var lookingAt = retTopObj();
    Object.keys(lookingAt).forEach(function(element) {
        oneLine(element);
    }, this);
    return 'nonono';
}

function mkdir(input) {
    var lookingAt = retTopObj();
    lookingAt[input] = new Object();
    return ('nonono');
}

/**
 * Helper function to return the topmost folder that the user is looking at.
 */

function retTopObj() {
    var fullDir = pwd();
    var lookingAt = fileStructure['/'];
    fullDir.split('/').forEach(function(element) {
        if (lookingAt[element] != undefined)
            lookingAt = lookingAt[element];
    }, this);
    return lookingAt;
}


/**
 * Creates a new history item that is only one line with the message passed.
 * Useful for when you don't want to include the current top directory.
 */

function oneLine(message) {
    var history = document.getElementById("history");
    var newParent = document.createElement("div");
    var newChild = document.createElement("p");
    newChild.innerHTML = message;
    newParent.id = "his" + histNum++;
    newParent.appendChild(newChild);
    history.appendChild(newParent);
    clearInput();
    window.scrollTo(0,document.body.scrollHeight);
    return('nonono');
}
