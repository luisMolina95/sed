const argv = require('yargs').argv;
const path = require('path')
const fs = require('fs')

/*console.log(process.argv[2]);
console.log(process.argv[3]);
console.log(argv)
console.log(require('yargs').parse())
console.log(path.resolve('joe.txt'))
console.log(path.normalize(path.resolve('../joe.txt')))
*/
console.log(argv)
var file = "empty.txt"
if(!containsOption(argv)){
	file = singleCommandFile(argv)
}

fs.readFile(file, 'utf8', handleFile)

function handleFile(err, data) {
	if (err) {
    	console.error(err)
    	return "error";
  	}
  	console.log(data)
   	var lines = data.split('\r\n')
   	var command = singleCommandSubst(argv)
   	console.log(lines)
   	console.log(command)
   	var print = substitute(lines, command.word, command.substitute).join('\n')
   	console.log(print)
}

function singleCommandFile(arg){
	return arg._[1]
}

function singleCommandSubst(arg){

	var argArray = arg._[0].split('/')
	var command = {action : argArray[0], word : argArray[1], substitute: argArray[2]}
	return command
}

function substitute(lineArray, word, substitute){
	var changedArray = []
	var firstOccurrence = true
	for(var line of lineArray){
		if(line.includes(word)&& firstOccurrence){
			changedArray.push(line.replace(word, substitute))
			firstOccurrence = false 
		}
		else{
			changedArray.push(line)
		}
	}
	return changedArray
}

function containsOption(arg){
	if('e' in  arg || 'f' in  arg || 'i' in  argv || 'n' in  arg) return true
	else return false
}

