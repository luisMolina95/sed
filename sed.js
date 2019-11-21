const argv = require('yargs').argv;
const path = require('path')
const fs = require('fs')
const substRegExr = /s\/[a-z0-9]+\/[a-z0-9]+\/?[gp]?/
const file = obtainFile(argv)
const containsN = containsOption(argv, 'n')
const containsE = containsOption(argv, 'e')
const isEAnArray = testEForArray(argv)
const substCommands = getSubtCommands(argv)

/*console.log(process.argv[2]);
console.log(process.argv[3]);
console.log(argv)
console.log(require('yargs').parse())
console.log(path.resolve('joe.txt'))
console.log(path.normalize(path.resolve('../joe.txt')))
*/
console.log(argv)
console.log(file)
if(containsE) console.log('CONTIENE -E')
fs.readFile(file, 'utf8', handleFile)

function handleFile(err, data) {
	if (err) {
    	console.error(err)
    	return "error";
  	}
  	console.log('Original data:')
  	console.log(data)
   	var fileLines = data.split('\r\n')
   	var mainSubstComm
   	var mainSubst
   	if(containsE && isEAnArray){
   		mainSubstComm = substCommandsToObjectArray(substCommands)
   		mainSubst = recursiveSubstitute(fileLines,mainSubstComm)
   	}
   	else{
   		mainSubstComm = substCommtoObject(substCommands)
   		mainSubst = substitute(fileLines, mainSubstComm)
   	}
   	console.log(fileLines)
   	console.log(mainSubstComm)
   	printSubst(mainSubst, mainSubstComm);
}


function printSubst(substObj, substCommObj){
	if(containsN){
		if(substCommObj.flag === 'p'){
			console.log(substObj.changedText[substObj.changedRows[0]])
		}
	}
	else{
		for(var line of substObj.changedText){
			console.log(line)
			if(substCommObj.flag === 'p' && line === substObj.changedText[substObj.changedRows[0]]) console.log(line)
		}
		
	}

}

function getSubtCommands(arg){
	if(containsN) return arg.n
	if(containsE) return arg.e
	else return arg._[0]
}

function isCommValid(command){
	if(substRegExr.test(command)) return true
	else return false
}

function obtainFile(arg){
	return arg._[arg._.length - 1]
}

function recursiveSubstitute(fileLines, substCommObjArray){
	var currentLineArray = fileLines
	var loopedSubst
	var finalChangedRows = []
	for(var substCommObj of substCommObjArray){
		loopedSubst = substitute(currentLineArray, substCommObj)
		finalChangedRows.push(loopedSubst.changedRows[0])
		currentLineArray = loopedSubst.changedText
	}
	loopedSubst.changedRows = finalChangedRows
	return loopedSubst
}

function substCommandsToObjectArray(substCommArray){
	var substCommObjArray = []
	for(var command of substCommArray){
		substCommObjArray.push(substCommtoObject(command))
	}
	return substCommObjArray
}

function substCommtoObject(substComm){
	var substCommObj
	if(isCommValid(substComm)){
		var fixedComm = substRegExr.exec(substComm)[0]
		var substCommArray = fixedComm.split('/')
		substCommObj = {action : substCommArray[0], word : substCommArray[1], substitute: substCommArray[2], flag : substCommArray[3] ? substCommArray[3] : ''}
	}

	else{
		console.log('The substitution command is not valid')
		substCommObj = {action : null, word : null, substitute: null, flag : null}
	}

	return substCommObj
	
}

function substitute(lineArray, substCommObj){
	var substObj = {changedText: [], isChanged: false, changedRows: []}
	var change = true
	var globalSubst = substCommObj.flag === 'g'
	
	for(var line of lineArray){
		if(line.includes(substCommObj.word) && change){
			substObj.changedRows.push({index: lineArray.indexOf(line), p: substCommObj.flag === 'p'})
			substObj.changedText.push(line.replace(substCommObj.word, substCommObj.substitute))
			substObj.isChanged = true
			if(substCommObj.flag === 'g') change = true
			else change = false
		}
		else{
			substObj.changedText.push(line)
		}
	}
	return substObj
}

function containsOption(arg, option){
	if(option in  arg) return true
	else return false
}

function testEForArray(arg){
	return typeof arg.e === 'object'
}
