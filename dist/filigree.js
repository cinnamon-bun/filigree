"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const nearley_1 = __importDefault(require("nearley"));
const filigreeGrammar = __importStar(require("./filigreeGrammar"));
let choose = (items) => items[Math.floor(Math.random() * items.length)];
// Given a raw FExpr object, clean it up and remove redundant parts
let optimize = (expr) => {
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
        };
    }
    return expr;
};
class Filigree {
    // Create a Filigree generator (a set of rules) from a Filigree-language source file.
    // source is a string of rules in Filigree format
    // If parsing fails, no error will be thrown, but this.err will become non-null
    // (and will contain an error message about what's wrong with the Filigree-language input).
    constructor(source) {
        this.rules = {};
        this.err = null;
        let parser = new nearley_1.default.Parser(nearley_1.default.Grammar.fromCompiled(filigreeGrammar));
        try {
            // add '\n' to ensure a comment on the last line lexes correctly
            let decls = parser.feed(source + '\n').results[0];
            for (let decl of decls) {
                this.rules[decl.name] = decl.value;
            }
            // TODO: warn if a rule is declared twice
        }
        catch (e) {
            this.err = e;
        }
        for (let name of Object.keys(this.rules)) {
            this.rules[name] = optimize(this.rules[name]);
        }
    }
    // Generate text from a rule.
    // name is a rule name
    generate(name) {
        if (this.rules[name] === undefined) {
            return '<' + name + '>'; // name not found
        }
        return this._evalFExpr(this.rules[name]);
    }
    // Convert this set of Filigree rules back into Filigree language.
    toString() {
        return this._renderRules(this._toStringFExpr.bind(this));
    }
    // Show this set of Filigree rules in a debugging format
    repr() {
        return this._renderRules(this._reprFExpr.bind(this));
    }
    _renderRules(fn) {
        let result = [];
        for (let name of Object.keys(this.rules)) {
            result.push(name + ' = ' + fn(this.rules[name]));
        }
        return result.join('\n');
    }
    // Convert back into filigree source code
    _toStringFExpr(expr) {
        let result = '????';
        if (expr.kind == 'seq') {
            result = expr.children.map(ch => this._toStringFExpr(ch)).join('');
        }
        else if (expr.kind === 'ref') {
            result = '<' + expr.name + '>';
        }
        else if (expr.kind == 'choose') {
            result = '[' + expr.children.map(ch => this._toStringFExpr(ch)).join('/') + ']';
        }
        else if (expr.kind === 'literal') {
            result = expr.text;
        }
        return result;
    }
    // Convert back into filigree source code but with extra notation to help understand the parsing
    _reprFExpr(expr) {
        let result = '????';
        if (expr.kind == 'seq') {
            result = '(' + expr.children.map(ch => this._reprFExpr(ch)).join('+') + ')';
        }
        else if (expr.kind === 'ref') {
            result = '<' + expr.name + '>';
        }
        else if (expr.kind == 'choose') {
            result = '[' + expr.children.map(ch => this._reprFExpr(ch)).join('/') + ']';
        }
        else if (expr.kind === 'literal') {
            result = '"' + expr.text + '"';
        }
        return result;
    }
    // Evaluate a Filigree expression object
    _evalFExpr(expr) {
        let result = '????';
        if (expr.kind == 'seq') {
            result = expr.children.map(ch => this._evalFExpr(ch)).join('');
        }
        else if (expr.kind === 'ref') {
            let x = this.rules[expr.name];
            if (x === undefined) {
                return '<' + expr.name + '>'; // name not found
            }
            else {
                // TODO: test for stack overflow
                return this._evalFExpr(x);
            }
        }
        else if (expr.kind == 'choose') {
            // TODO: determinism
            // TODO: move the most recent item to the end of the list of children
            result = this._evalFExpr(choose(expr.children));
        }
        else if (expr.kind === 'literal') {
            result = expr.text;
        }
        // TODO: allow wrapping the result in tags
        //return `<div class="expr">${result}</div>`;
        return result;
    }
}
exports.Filigree = Filigree;
