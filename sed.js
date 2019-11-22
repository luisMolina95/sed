const argv = require('yargs').argv; //argv holds all the typed arguments, option sorted arguments
const fs = require('fs'); //fs holds the file management object
const substRegExr = /s\/[a-z0-9]+\/[a-z0-9]+\/?[gp]?/; //substRegExr holds the Regular Expression for the substitution commands
const file = obtainFile(argv); //file holds the path of file containg the text to be replaced
const containsF = containsOption(argv, 'f'); //the variables containsX, hold a boolean
const containsN = containsOption(argv, 'n'); // they check if argv contains it respective key
const containsE = containsOption(argv, 'e');
const containsI = containsOption(argv, 'i');
const isEAnArray = testEForArray(argv); //isEAnArray holds a boolean, argv.e is suppossed to contain multiple items, we check on it here
const substCommands = getSubtCommands(argv); //substCommands holds an array of strings with all the substitution
const iExtension = argv.i; //iExtension holds the extension of the original copy, file.[iExtension]

//We can see multiple commented console.log()s, i used this for testing
//You can remove the slashes if you want to see inside info of what is happening
//console.log('\x1b[34m%s\x1b[0m', 'ARGUMENTS (argv):');
//console.log(argv);
checkFile(file); //we make sure that the main file is ok
var data = fs.readFileSync(file, 'utf8'); //if the file is ok we read it and save the file cotents in data
var fileLines = data.split('\r\n'); //se split the data in lines, fileLines is a string array

var mainSubstComm; //We declare mainSubstComm and mainSubst
var mainSubst; //This 2 are the main Objects that make the program work

//console.log('\x1b[34m%s\x1b[0m', 'SUBSTITUTION COMMANDS (substCommands):');
//console.log(substCommands);

//Depending on wihch keys the argument (argv) contains, is the type of object we are going to fill in
//The following 4 functions are the ones that transform the string into object that we can work with
//This one is if we have multiple substitution commands
if ((containsE && isEAnArray) || containsF) {
  mainSubstComm = substCommandsToObjectArray(substCommands);
  mainSubst = recursiveSubstitute(fileLines, mainSubstComm);
}
//This one is if we have just one substitution command
else {
  mainSubstComm = substCommtoObject(substCommands);
  mainSubst = substitute(fileLines, mainSubstComm);
}
//console.log('\x1b[34m%s\x1b[0m', 'TEXT LINES OBTAIN FROM THE FILE(fileLines):');
//console.log(fileLines);
/*console.log(
  '\x1b[34m%s\x1b[0m',
  'MAIN SUBSTITUTION COMMANDS OBJECT (mainSubstComm):'
);*/
//console.log(mainSubstComm);
//console.log('\x1b[34m%s\x1b[0m', 'MAIN SUSTITUCION OBJECT (mainSubst):');
//console.log(mainSubst);

//if the argument (argv) contains the option -i, we first make a copy of the original file
//and then take the text from the main substitution and write it, on the original file
if (containsI) {
  var newText = mainSubst.changedText.join('\r\n');
  var fileName = file.split('.')[0];
  fs.copyFileSync(file, fileName + '.' + iExtension);
  fs.writeFileSync(file, newText);
}
//console.log('\x1b[34m%s\x1b[0m', 'FINAL OUTPUT TEXT:');
//We don't want any message on the console, we already save them on the file
//So the substitution only prints if -i is missing
if (!containsI) printSubst(mainSubst); //this prints the final output with all (or none) of the substitutions

//getFileCommands, gets the file name and return an string array with all the lines
//I used this one in conjunction with getSubtCommands(), to return the correct info in case -f was on
function getFileCommands(file) {
  checkFile(file);
  if (containsF) return fs.readFileSync(file, 'utf8').split('\r\n');
  else return null;
}

//printSubst, takes a substitution object and prints it, it prints following the set rules
//If -i is on, no printing unless you have a p
function printSubst(substObj) {
  if (containsN) {
    for (var row of substObj.changedRows) {
      if (row.p) console.log(substObj.changedText[row.index]);
    }
  } else {
    for (var [index, line] of substObj.changedText.entries()) {
      console.log(line);
      for (var row of substObj.changedRows) {
        if (row.index === index && row.p) console.log(line);
      }
    }
  }
}

//getSubtCommands, gets the agument and returns the correct Substution command (string array or string)
//it's an smart one, it checks all the option (n,e,f) escenarios
function getSubtCommands(arg) {
  if (containsN) {
    if (typeof arg.n === 'boolean' && containsE) return arg.e;
    else if (containsF) return getFileCommands(arg.f);
    else return arg.n;
  }
  if (containsE) return arg.e;
  if (containsF) return getFileCommands(arg.f);
  else return arg._[0];
}

function isCommValid(command) {
  if (substRegExr.test(command)) return true;
  else return false;
}

function obtainFile(arg) {
  return arg._[arg._.length - 1];
}

function recursiveSubstitute(fileLines, substCommObjArray) {
  var currentLineArray = fileLines;
  var loopedSubst;
  var finalChangedRows = [];
  for (var substCommObj of substCommObjArray) {
    loopedSubst = substitute(currentLineArray, substCommObj);
    if (loopedSubst.changedRows[0])
      finalChangedRows.push(loopedSubst.changedRows[0]);
    currentLineArray = loopedSubst.changedText;
  }
  loopedSubst.changedRows = finalChangedRows;
  return loopedSubst;
}

function substCommandsToObjectArray(substCommArray) {
  var substCommObjArray = [];
  for (var command of substCommArray) {
    substCommObjArray.push(substCommtoObject(command));
  }
  return substCommObjArray;
}

function substCommtoObject(substComm) {
  var substCommObj;
  if (isCommValid(substComm)) {
    var fixedComm = substRegExr.exec(substComm)[0];
    var substCommArray = fixedComm.split('/');
    substCommObj = {
      action: substCommArray[0],
      word: substCommArray[1],
      substitute: substCommArray[2],
      flag: substCommArray[3] ? substCommArray[3] : ''
    };
  } else {
    console.log('The substitution "' + substComm + '" command is not valid');
    substCommObj = { action: null, word: null, substitute: null, flag: null };
  }

  return substCommObj;
}

//substitute, takes an string array and a substitution command object and returns a substitution object
//This one is very important
function substitute(lineArray, substCommObj) {
  var substObj = { changedText: [], isChanged: false, changedRows: [] };
  var change = true;
  var globalSubst = substCommObj.flag === 'g';

  for (var line of lineArray) {
    if (line.includes(substCommObj.word) && change) {
      substObj.changedRows.push({
        index: lineArray.indexOf(line),
        p: substCommObj.flag === 'p'
      });
      substObj.changedText.push(
        line.replace(substCommObj.word, substCommObj.substitute)
      );
      substObj.isChanged = true;
      if (substCommObj.flag === 'g') change = true;
      else change = false;
    } else {
      substObj.changedText.push(line);
    }
  }
  return substObj;
}

function containsOption(arg, option) {
  if (option in arg) return true;
  else return false;
}

function testEForArray(arg) {
  return typeof arg.e === 'object';
}

function checkFile(file) {
  try {
    fs.accessSync(file);
  } catch (error) {
    console.log(
      'Unable to access file (incorrect or missing file path: ' + file + ')'
    );
    process.exit();
  }
}
