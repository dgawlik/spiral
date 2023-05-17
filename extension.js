const vscode = require('vscode');
const {
	EditorNavigator,
	Predicates

} = require('./util');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	context.subscriptions.push(vscode.commands.registerCommand('spiral.select.nextword', () => selectNextWord(false)));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.select.previousword', () => selectPreviousWord(false)));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.select.nextwordsep', () => selectNextWord(true)));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.select.previouswordsep', () => selectPreviousWord(true)));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.select.nextblock', selectNextBlock));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.select.previousblock', selectPreviousBlock));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.select.tochar', () => selectToChar(context)));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.jump.tochar', () => jumpToChar(context)));
	context.subscriptions.push(vscode.commands.registerCommand('spiral.filter.selections', filterSelections));
}

function moveLeftWhile(navigator, anchorOffset, activeOffset, predicate) {
	if (anchorOffset < activeOffset) {
		while(anchorOffset > 0 && predicate(navigator.getText(anchorOffset-1, activeOffset))) {
			anchorOffset--;
		}
	} else {
		while(activeOffset > 0 && predicate(navigator.getText(anchorOffset, activeOffset-1))) {
			activeOffset--;
		}
	}

	return [anchorOffset, activeOffset];
}

function moveRightWhile(navigator, anchorOffset, activeOffset, predicate) {
	if (anchorOffset < activeOffset) {
		while(activeOffset < navigator.getLength()-1 && predicate(navigator.getText(anchorOffset, activeOffset+1))) {
			activeOffset++;
		}
	} else {
		while(anchorOffset < navigator.getLength()-1 && predicate(navigator.getText(anchorOffset+1, activeOffset))) {
			activeOffset++;
		}
	}

	return [anchorOffset, activeOffset];
}



function selectNextWord(excludeSeparators) {
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let navigator = new EditorNavigator(editor);
		let predicates = new Predicates(editor.document.languageId);
		let offset = navigator.positionToOffset(editor.selection.active);

		while(offset < navigator.getLength()-1 && predicates.isAllBlanksOrSeparators(navigator.getText(offset, offset+1), false)) {
			offset++;
		}
		
		let [anchor, active] = [offset, offset+1];

		[anchor, active] = moveLeftWhile(navigator, anchor, active, text => predicates.isAllText(text, excludeSeparators));
		[anchor, active] = moveRightWhile(navigator, anchor, active, text => predicates.isAllText(text, excludeSeparators));

		editor.selection = navigator.getSelection(anchor, active);
	}
}

function selectPreviousWord(excludeSeparators) {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		
		let navigator = new EditorNavigator(editor);
		let predicates = new Predicates(editor.document.languageId);
		let offset = navigator.positionToOffset(editor.selection.active);

		while(offset > 0 && predicates.isAllBlanksOrSeparators(navigator.getText(offset-1, offset), false)) {
			offset--;
		}
		
		let [anchor, active] = [offset, offset-1];

		[anchor, active] = moveLeftWhile(navigator, anchor, active, text => predicates.isAllText(text, excludeSeparators));
		[anchor, active] = moveRightWhile(navigator, anchor, active, text => predicates.isAllText(text, excludeSeparators));

		editor.selection = navigator.getSelection(anchor, active);
	}
}


function selectToChar(context) {

	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let disposable = vscode.commands.registerCommand('type', function (args){
			goToChar(editor, args.text, true);
			disposable.dispose();
		});

		context.subscriptions.push(disposable);
	}
}

function jumpToChar(context) {

	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let disposable = vscode.commands.registerCommand('type', function (args){
			goToChar(editor, args.text, false);
			disposable.dispose();
		});

		context.subscriptions.push(disposable);
	}
}


function goToChar(editor, text, selecting) {
	let navigator = new EditorNavigator(editor);

	let offset = navigator.positionToOffset(editor.selection.active);
	let [anchor, active] = [offset, offset+1];

	while (active < navigator.getLength() && navigator.getText(active, active+1) !== text) {
		active++;
		if (selecting) {
			editor.selection = navigator.getSelection(anchor, active);
		} else {
			editor.selection = navigator.getSelection(active, active);
		}
	}
}

function selectNextBlock() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		let navigator = new EditorNavigator(editor);
		let offset = navigator.positionToOffset(editor.selection.active);

		let nl = navigator.getEol();
		let nl2 = `${nl}${nl}`;

		while(offset < navigator.getLength()-nl.length-1 && navigator.getText(offset, offset+nl.length) === nl) {
			offset += nl.length;
		}

		if(offset == navigator.getLength() - nl.length - 1) {
			return;
		}

		let [anchor, active] = [offset, offset+1];

		while (anchor > 0 && !navigator.getText(anchor, active).includes(nl2)) {
			anchor--;
		}

		if(navigator.getText(anchor, active).includes(nl2)) {
			anchor += nl2.length;
		}

		while (active < navigator.getLength()-1 && !navigator.getText(anchor, active).includes(nl2)){
			active++;
		}

		if(navigator.getText(anchor, active).includes(nl2)){
			active -= nl2.length;
		}

		editor.selection = navigator.getSelection(anchor, active);
	}
}

function selectPreviousBlock() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		let navigator = new EditorNavigator(editor);
		let offset = navigator.positionToOffset(editor.selection.active);

		let nl = navigator.getEol();
		let nl2 = `${nl}${nl}`;

		while(offset > nl.length && navigator.getText(offset-nl.length, offset) === nl) {
			offset -= nl.length;
		}

		if(offset == nl.length) {
			return;
		}

		let [anchor, active] = [offset, offset-1];

		while (anchor < navigator.getLength()-1 && !navigator.getText(anchor, active).includes(nl2)) {
			anchor++;
		}

		if(navigator.getText(anchor, active).includes(nl2)) {
			anchor -= nl2.length;
		}

		while (active > 0 && !navigator.getText(anchor, active).includes(nl2)){
			active--;
		}

		if(navigator.getText(anchor, active).includes(nl2)){
			active += nl2.length;
		}

		editor.selection = navigator.getSelection(anchor, active);
	}
}

async function filterSelections(){
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const result = await vscode.window.showInputBox({
			value: '',
			placeHolder: 'Filter',
		});

		if (!result){
			return;
		}

		let navigator = new EditorNavigator(editor);
		let anchor = navigator.positionToOffset(editor.selection.anchor);
		let active = navigator.positionToOffset(editor.selection.active);

		let selections = [];

		for (let i=anchor;i <= active - result.length;i++) {
			if(navigator.getText(i, i+result.length) === result){
				selections.push(navigator.getSelection(i, i+result.length))
			}
		} 

		if(selections){
			editor.selections = selections;
		}
	}
}



// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
