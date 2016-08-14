var histNum = 0; //Total number of history elements.
var currDir = "~"; //Top of the dirStack.
var dirStack = []; //Stack of current directory chain
var commandNum = 0; //Total number of commands.
var commandStack = []; //Remembers previous commands.
var lookingAtCommand = 0; //Command index that is currently in the input.
var currentCommand = ""; //Saves a command that has not been entered yet when going through the history/

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
    addHistory(result); //Adds result of command to history, if one is given.
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
        lookingAtCommand++;
        input.value = currentCommand;
    }
}

/**
 * Method to parse input after enter key is pressed.
 * Returns what is to be printed after the directory.
 */

function parseInput(input) {
    var inArr = input.split(" ");
    switch (inArr[0]) {
        case 'cd':
            return cd(inArr[1]);
        case 'pwd':
            return pwd();
        default:
            return "Unrecognized command";
    }
}

function addHistory(result) {
    var history = document.getElementById("history");
    var newParent = document.createElement("div");
    var newChild = document.createElement("p");
    var input = document.getElementById("input");

    newChild.innerHTML = currDir + " " + result;
    if (result != input.value) {
        clearInput();
    }
    if (result != "nonono") {
        newParent.id = "his" + histNum++;
        newParent.appendChild(newChild);
        history.appendChild(newParent);
    }
}

function clearInput() {
    var input = document.getElementById("input");
    input.value = "";
}

function cd(input) {
    if (input === '..') {
        alert(dirStack);
        currDir = dirStack.pop();
        document.getElementById("headInfo").innerHTML = currDir;
    } else {
        dirStack.push(currDir);
        currDir = input;
        document.getElementById("headInfo").innerHTML = currDir;
    }
    return("nonono"); //Returns this value to signify that this command has no output.
}

function pwd() {
    return dirStack.join('/') + '/' + currDir;
}