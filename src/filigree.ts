import nearley from 'nearley';
import titlecase from 'titlecase';
import seedrandom from 'seedrandom';
type Rng = any;  // from seedrandom package
import {
    FChoose,
    FDecl,
    FExpr,
    FLiteral,
    FRef,
    FSeq,
} from './filigreeGrammar';
import * as filigreeGrammar from './filigreeGrammar';

//--------------------------------------------------------------------------------
// HELPERS

// return an array [0, 1, ..., n-1]
let range = (n : number) : number[] =>
    [...Array(n).keys()]

let choose = <T>(items : T[]) : T =>
    items[Math.floor(Math.random() * items.length)];

let detChoose = <T>(items : T[], rng : Rng) : T =>
    items[Math.floor(rng() * items.length)];

// inclusive integer range
let rngRange = (rng : Rng, min : number, max : number) : number => {
    let max1 = max + 1;
    return Math.floor(rng() * (max1-min) + min);
}

// choose a random item from the front 60% of the array, move it to the back, then return the item
let detChooseAndMoveToBack = <T>(items : T[], rng : Rng) : T => {
    let ii : number;
    if (items.length <= 1) {
        return items[0];
    } else if (items.length === 2) {
        ii = Math.floor(rng() * 1.2); // usually the first one, but not always
    } else {
        // choose from the first 60% of the array, rounded up
        let countToConsider = Math.max(1, Math.ceil((items.length-1) * 0.6));
        ii = rngRange(rng, 0, countToConsider-1);
    }
    let item = items[ii];
    items.splice(ii, 1);
    items.push(item);
    return item;
}

// shuffle in place
let detShuffleArray = <T>(items : T[], idFn : (t : T) => number, rng : Rng) : void => {
    // TODO: sort by deterministic key of item which includes all its children
    items.sort((a : T, b : T) => idFn(a) - idFn(b));
    for (let ii = 0; ii < items.length-1; ii++) {
        let kk = rngRange(rng, ii, items.length-1);
        let temp : T = items[ii];
        items[ii] = items[kk];
        items[kk] = temp;
    }
}

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

//--------------------------------------------------------------------------------

// Given a raw FExpr object, clean it up and remove redundant parts
let optimizeExprs = (expr : FExpr) : FExpr => {
    // recurse to children
    if (expr.kind === 'seq' || expr.kind === 'choose') {
        expr.children = expr.children.map(optimizeExprs);
    }

    // TODO: if seq has empty literals, remove them

    // convert two-char "\\n" to actual one-char "\n"
    if (expr.kind === 'literal') {
        expr.text = expr.text.split('\\n').join('\n');
    }

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

// recursively assign unique ids to the exprs in sequence
let assignIds = (expr : FExpr, idBox : number[]) : void => {
    expr.id = idBox[0];
    idBox[0] += 1;
    if (expr.kind === 'seq' || expr.kind === 'choose') {
        expr.children.forEach(ch => assignIds(ch, idBox));
    }
}

// Randomly shuffle the children of all the choice exprs, recursively
let shuffleChoices = (expr : FExpr, rng : Rng) : void => {
    if (expr.kind === 'choose') {
        let sortFn = (x : FExpr) : number => x.id;
        detShuffleArray(expr.children, sortFn, rng);
    }
    if (expr.kind === 'seq' || expr.kind === 'choose') {
        expr.children.forEach(ch => shuffleChoices(ch, rng));
    }
}

let repeatModUntilNoChange = (input : string, fn : (input : string) => string) => {
    let prev : string | null = null;
    while (prev !== input) {
        prev = input;
        input = fn(input);
    }
    return input;
};

let makeModifiers = () => ({
    s: (input : string) => input + 's',    // TODO: make this smarter
    a: (input : string) => 'a ' + input,   // TODO: make this smarter
    ed: (input : string) => input + 'ed',  // TODO: make this smarter

    trim: (input : string) => input.trim(),
    mergeSpaces: (input : string) => {
        // replace consecutive spaces with one space
        return repeatModUntilNoChange(input, (input) => {
            return input.split('  ').join(' ');
        });
    },

    uppercase: (input : string) => input.toUpperCase(),
    lowercase: (input : string) => input.toLowerCase(),
    titlecase: (input : string) => titlecase(input),
    sentencecase: (input : string) => {
        // capitalize first character only
        if (input.length === 0) { return input; }
        return input[0].toUpperCase() + input.slice(1);
    },

    inception: (input : string) => input.toUpperCase().split('').join(' '),  // "hello" -> "H E L L O"
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

// TODO: we need two kinds of functions, rawTextTransform and ruleWrapper
// rawTextTransform should only apply to the lowest level literal strings
//   it's meant for transforming html entities and linebreaks
// ruleWrapper goes around each named rule
//   it's meant to surround rules with recursive html markup for display
// still unknown: how to handle "\" + "n" so it doesn't get capitalized by modifiers
export type WrapperFn = (rule : string, text : string) => string;

export class Filigree {
    rules : {[name:string] : FExpr} = {};
    err : Error | null = null;
    modifiers : {[name:string] : (input : string) => string} = makeModifiers();
    rng : Rng;
    // Create a Filigree generator (a set of rules) from a Filigree-language source file.
    // source is a string of rules in Filigree format
    // If parsing fails, no error will be thrown, but this.err will become non-null
    // (and will contain an error message about what's wrong with the Filigree-language input).
    constructor(source : string, seed? : string) {
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
        let idBox = [0];
        for (let name of this.ruleNames()) {
            this.rules[name] = optimizeExprs(this.rules[name]);
            assignIds(this.rules[name], idBox);
        }

        this.seed(seed);
    }
    seed(seed? : string) : void {
        // omit seed to get a different random one each time
        this.rng = seedrandom(seed);
        for (let name of this.ruleNames()) {
            shuffleChoices(this.rules[name], this.rng);
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
            result = this._evalFExpr(detChooseAndMoveToBack(expr.children, this.rng), wrapperFn);
        } else if (expr.kind === 'literal') {
            result = expr.text;
        }
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




