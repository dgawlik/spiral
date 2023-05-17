const vscode = require('vscode');


class EditorNavigator {

    constructor(editor) {
        this.editor = editor;
        this.LEN = editor.document.getText().length;;
    }

    offsetToPosition(offset) {
        return this.editor.document.validatePosition(
                this.editor.document.positionAt(offset));
    }

    positionToOffset(position) {
        return this.editor.document.offsetAt(position);
    }
    

    getText(anchorOffset, activeOffset) {
        return this.editor.document.getText(
            this.getSelection(anchorOffset, activeOffset));
    }

    getLength() {
        return this.LEN;
    }

    getSelection(anchorOffset, activeOffset) {
        return new vscode.Selection(
            this.offsetToPosition(anchorOffset), 
            this.offsetToPosition(activeOffset));
    }

    getEol() {
        if(this.editor.document.eol === 1){
            return "\n";
        }
        else {
            return "\r\n";
        }
    }
    
}


class Predicates {

    constructor(languageId) {
        this.BLANKS = "\r\n\t " + String.fromCharCode(
            0xa0,
            0x1680,
            0x2000,
            0x2001,
            0x2002,
            0x2003,
            0x2004,
            0x2005,
            0x2006,
            0x2007,
            0x2008,
            0x2009,
            0x200a,
            0x2028,
            0x2029,
            0x202f,
            0x205f,
            0x3000,
          );

          this.SEPARATORS = vscode.workspace
            .getConfiguration("editor", { languageId })
            .get("wordSeparators");
    }

    isAllBlanksOrSeparators(text, excludeSeparators) {
        for (let i=0;i<text.length; i++){
            if (!this.BLANKS.includes(text.charAt(i))) {

                if (!excludeSeparators && this.SEPARATORS.includes(text.charAt(i))) {
                    continue;
                } else if (!excludeSeparators && !this.SEPARATORS.includes(text.charAt(i))) {
                    return false;
                } else {
                    return false;
                }
            }
        }
    
        return true;
    }

    isAllText(text, excludeSeparators) {
        for (let i=0;i<text.length; i++){
            if (this.BLANKS.includes(text.charAt(i))) {
                return false;
            }

            if(!excludeSeparators && this.SEPARATORS.includes(text.charAt(i))){
                return false;
            }
        }
    
        return true;
    }

}





module.exports = {
   EditorNavigator,
   Predicates
}