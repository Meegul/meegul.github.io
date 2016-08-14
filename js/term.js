var histNum = 0;
var currDir = "~";
var dirStack = [];
var commandNum = 0;
var commandStack = [];
var lookingAtCommand = 0;
var currentCommand = "";

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

function enter(input) {
    commandNum++;
    lookingAtCommand = commandNum;
    commandStack.push(input.value);
    addHistory(input.value);
    var result = parseInput(input.value);
    addHistory(result);
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
    } else if (lookingAtCommand === commandNum - 1) {
        lookingAtCommand++;
        input.value = currentCommand;
    }
}

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
    return("nonono");
}

function pwd() {
    return dirStack.join('/') + '/' + currDir;
}