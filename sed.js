const argv = require('yargs').argv;
const path = require('path')
const fs = require('fs')
const substRegExr = /s\/[a-z0-9]+\/[a-z0-9]+\/?[gp]?/
const file = obtainFile(argv)
const nOption = containsOption(argv, 'n')

/*console.log(process.argv[2]);
console.log(process.argv[3]);
console.log(argv)
console.log(require('yargs').parse())
console.log(path.resolve('joe.txt'))
console.log(path.normalize(path.resolve('../joe.txt')))
*/
console.log(argv)
console.log(file)

fs.readFile(file, 'utf8', handleFile)

function handleFile(err, data) {
	if (err) {
    	console.error(err)
    	return "error";
  	}
  	console.log('Original data:')
  	console.log(data)
   	var lines = data.split('\r\n')
   	var mainSubstComm = argToSubstComm(argv)
   	console.log(lines)
   	console.log(mainSubstComm)
   	var mainSubst = substitute(lines, mainSubstComm)
   	printSubst(mainSubst, mainSubstComm);
}

function printSubst(substObj, substCommObj){
	if(nOption){
		console.log('Hay N')
		if(substCommObj.flag === 'p'){
			console.log('Hay p')
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

function getSubtCommand(arg){
	if(nOption) return arg.n
	else return arg._[0]
}

function isCommValid(command){
	if(substRegExr.test(command)) return true
	else return false
}

function obtainFile(arg){
	return arg._[arg._.length - 1]
}

function argToSubstComm(arg){
	var substComm = getSubtCommand(arg)
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
	console.log('Hay G')
	var globalSubst = substCommObj.flag === 'g'
	
	for(var line of lineArray){
		if(line.includes(substCommObj.word) && change){
			substObj.changedRows.push(lineArray.indexOf(line))
			substObj.changedText.push(line.replace(substCommObj.word, substCommObj.substitute))
			substObj.isChanged = true
			if(substCommObj.flag === 'g') change = true
			else change = false
		}
		else{
			substObj.changedText.push(line)
		}
	}
	console.log(substObj)
	return substObj
}

function containsOption(arg, option){
	if(option in  arg) return true
	else return false
}

