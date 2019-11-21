const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs');
const substRegExr = /s\/[a-z0-9]+\/[a-z0-9]+\/?[gp]?/;
const file = obtainFile(argv);
const containsF = containsOption(argv, 'f');
const containsN = containsOption(argv, 'n');
const containsE = containsOption(argv, 'e');
const containsI = containsOption(argv, 'i');
const isEAnArray = testEForArray(argv);
const substCommands = getSubtCommands(argv);
const iExtension = argv.i;

console.log('\x1b[34m%s\x1b[0m', 'ARGUMENTOS (argv):');
console.log(argv);
checkFile(file);
var data = fs.readFileSync(file, 'utf8');
var fileLines = data.split('\r\n');

var mainSubstComm;
var mainSubst;

console.log('\x1b[34m%s\x1b[0m', 'COMMANDOS DE SUBSTITUCION (substCommands):');
console.log(substCommands);

if ((containsE && isEAnArray) || containsF) {
  mainSubstComm = substCommandsToObjectArray(substCommands);
  mainSubst = recursiveSubstitute(fileLines, mainSubstComm);
} else {
  mainSubstComm = substCommtoObject(substCommands);
  mainSubst = substitute(fileLines, mainSubstComm);
}
console.log('\x1b[34m%s\x1b[0m', 'TEXT LINES OBTAIN FROM THE FILE(fileLines):');
console.log(fileLines);
console.log(
  '\x1b[34m%s\x1b[0m',
  'MAIN SUBSTITUTION COMMANDS OBJECT (mainSubstComm):'
);
console.log(mainSubstComm);
console.log('\x1b[34m%s\x1b[0m', 'MAIN SUSTITUCION OBJECT (mainSubst):');
console.log(mainSubst);
if (containsI) {
  var newText = mainSubst.changedText.join('\r\n');
  var fileName = file.split('.')[0];
  fs.copyFileSync(file, fileName + '.' + iExtension);
  fs.writeFileSync(file, newText);
}
console.log('\x1b[34m%s\x1b[0m', 'FINAL OUTPUT TEXT:');
printSubst(mainSubst);

function getFileCommands(file) {
  checkFile(file);
  if (containsF) return fs.readFileSync(file, 'utf8').split('\r\n');
  else return null;
}

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

function getSubtCommands(arg) {
  if (containsN) {
    if (typeof arg.n === 'boolean' && containsE) return arg.e;
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
