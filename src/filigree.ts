import nearley from 'nearley';
import titlecase from 'titlecase';
import {
    FChoose,
    FDecl,
    FExpr,
    FLiteral,
    FRef,
    FSeq,
} from './filigreeGrammar';
import * as filigreeGrammar from './filigreeGrammar';

let choose = <T>(items : T[]) : T =>
    items[Math.floor(Math.random() * items.length)];

let dedupeStrings = (arr : string[]) : string[] => {
    // given an array of strings, return a new array with duplicates removed
    let obj : { [key:string] : boolean } = {};
    for (let item of arr) {
        obj[item] = true;
    }
    return Object.keys(obj);
}

let flatten = (arr : any[]) : any[] => {
    let result : any[] = [];
    for (let item of arr) {
        if (Array.isArray(item)) {
            result = result.concat(flatten(item));
        } else {
            result.push(item);
        }
    }
    return result;
}

// Given a raw FExpr object, clean it up and remove redundant parts
let optimize = (expr : FExpr) : FExpr => {
    // recurse to children
    if (expr.kind === 'seq' || expr.kind === 'choose') {
        expr.children = expr.children.map(optimize);
    }

    // TODO: if seq has empty literals, remove them

    // if seq or choose has only one child, return that child instead
    if ((expr.kind === 'seq' || expr.kind === 'choose') && expr.children.length === 1) {
        return expr.children[0];
    }
    // convert seq or choose with no children into an empty literal
    if ((expr.kind === 'seq' || expr.kind === 'choose') && expr.children.length === 0) {
        return {
            kind: 'literal',
            text: '',
        } as FLiteral;
    }
    return expr;
}

let makeModifiers = () => ({
    s: (input : string) => input + 's',    // TODO: make this smarter
    a: (input : string) => 'a ' + input,   // TODO: make this smarter
    ed: (input : string) => input + 'ed',  // TODO: make this smarter
    uppercase: (input : string) => input.toUpperCase(),
    lowercase: (input : string) => input.toLowerCase(),
    inception: (input : string) => input.toUpperCase().split('').join(' '),  // "hello" -> "H E L L O"
    titlecase: (input : string) => titlecase(input),
    trim: (input : string) => input.trim(),
    collapseWhitespace: (input : string) => input, // TODO: replace consecutive spaces with one space
    wackycase: (input : string) => {
        // "hello" -> "hElLo"
        let result : string[] = [];
        for (let ii = 0; ii < input.length; ii++) {
            if (ii % 2 === 0) { result.push(input[ii].toLowerCase()); }
            else { result.push(input[ii].toUpperCase()) }
        }
        return result.join('');
    },
    // TODO: sentencecase
});

export type WrapperFn = (rule : string, text : string) => string;

export class Filigree {
    rules : {[name:string] : FExpr} = {};
    err : Error | null = null;
    modifiers : {[name:string] : (input : string) => string} = makeModifiers();
    // Create a Filigree generator (a set of rules) from a Filigree-language source file.
    // source is a string of rules in Filigree format
    // If parsing fails, no error will be thrown, but this.err will become non-null
    // (and will contain an error message about what's wrong with the Filigree-language input).
    constructor(source : string) {
        let parser = new nearley.Parser(nearley.Grammar.fromCompiled(filigreeGrammar));
        try {
            // add '\n' to ensure a comment on the last line lexes correctly
            let decls : FDecl[] = parser.feed(source + '\n').results[0];
            for (let decl of decls) {
                this.rules[decl.name] = decl.value;
            }
            // TODO: warn if a rule is declared twice
        } catch (e) {
            this.err = e;
        }
        for (let name of this.ruleNames()) {
            this.rules[name] = optimize(this.rules[name]);
        }
    }
    ruleNames() : string[] {
        return Object.keys(this.rules);
    }
    refsInRule(ruleName : string) : string[] {
        // return a list of the rules referenced by the given rule
        let refsInExpr = (expr : FExpr) : string[] => {
            if (expr.kind === 'ref') {
                return [expr.name];
            } else if (expr.kind === 'seq' || expr.kind === 'choose') {
                return dedupeStrings(flatten(expr.children.map(refsInExpr)));
            } else {
                return [];
            }
        }
        return refsInExpr(this.rules[ruleName]);
    }
    // Generate text from a rule.
    // name is a rule name
    generate(name : string, wrapperFn? : WrapperFn) : string {
        if (this.rules[name] === undefined) {
            return '<' + name + '>';  // name not found
        }
        let result = this._evalFExpr(this.rules[name], wrapperFn);
        if (wrapperFn !== undefined) {
            result = wrapperFn(name, result);
        }
        return result;
    }
    // Evaluate a Filigree expression object
    _evalFExpr(expr : FExpr, wrapperFn? : WrapperFn) : string {
        let result : string = '????';
        if (expr.kind == 'seq') {
            result = expr.children.map(ch => this._evalFExpr(ch, wrapperFn)).join('');
        } else if (expr.kind === 'ref') {
            let x = this.rules[expr.name];
            if (x === undefined) {
                return '<' + expr.name + '>';  // rule name not found
            } else {
                // TODO: test for stack overflow
                // TODO: warn on bad modifier name
                result = this._evalFExpr(x, wrapperFn);
                for (let modName of expr.mods) {
                    let modFn = this.modifiers[modName] || ( (x : string) => x);
                    result = modFn(result);
                }
                if (wrapperFn !== undefined) {
                    result = wrapperFn(expr.name, result);
                }
            }
        } else if (expr.kind == 'choose') {
            // TODO: determinism
            // TODO: move the most recent item to the end of the list of children
            result = this._evalFExpr(choose(expr.children), wrapperFn);
        } else if (expr.kind === 'literal') {
            result = expr.text;
        }
        // TODO: allow wrapping the result in tags
        //return `<div class="expr">${result}</div>`;
        return result;
    }
    // Convert this set of Filigree rules back into Filigree language.
    toString() : string {
        return this._renderRules(this._toStringFExpr.bind(this));
    }
    // Show this set of Filigree rules in a debugging format
    repr() : string {
        return this._renderRules(this._reprFExpr.bind(this));
    }
    _renderRules(fn : (x : FExpr) => string) : string {
        let result : string[] = [];
        for (let name of this.ruleNames()) {
            result.push(name + ' = ' + fn(this.rules[name]));
        }
        return result.join('\n');
    }
    // Convert back into filigree source code
    _toStringFExpr(expr : FExpr) : string {
        let result : string = '????';
        if (expr.kind == 'seq') {
            result = expr.children.map(ch => this._toStringFExpr(ch)).join('');
        } else if (expr.kind === 'ref') {
            let mods = expr.mods.join('.');
            if (mods) { mods = '.' + mods; }
            result = '<' + expr.name + mods + '>';
        } else if (expr.kind == 'choose') {
            result = '[' + expr.children.map(ch => this._toStringFExpr(ch)).join('/') + ']';
        } else if (expr.kind === 'literal') {
            result = expr.text;
        }
        return result;
    }
    // Convert back into filigree source code but with extra notation to help understand the parsing
    _reprFExpr(expr : FExpr) : string {
        let result : string = '????';
        if (expr.kind == 'seq') {
            result = '(' + expr.children.map(ch => this._reprFExpr(ch)).join('+') + ')';
        } else if (expr.kind === 'ref') {
            let mods = expr.mods.join('.');
            if (mods) { mods = '.' + mods; }
            result = '<' + expr.name + mods + '>';
        } else if (expr.kind == 'choose') {
            result = '[' + expr.children.map(ch => this._reprFExpr(ch)).join('/') + ']';
        } else if (expr.kind === 'literal') {
            result = '"' + expr.text + '"';
        }
        return result;
    }
}




