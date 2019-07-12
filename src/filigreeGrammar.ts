// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var nl: any;
declare var ruleName: any;
declare var dot: any;
declare var or: any;
declare var nonControlChars: any;

let moo = require('moo');
let lexer = moo.compile({
    ruleName: /[a-zA-Z0-9_-]+/,  // this is also used for modifier names
    eq: " = ",
    lbrak: "[",
    rbrak: "]",
    lang: "<",
    rang: ">",
    or: "/",
    dot: ".",
    // ignorable noise between lines:
    // optional whitespace
    // optional comment to the end of the line (starting with "#")
    // a required newline
    // optional whitespace starting the next line
    // This assumes the string ends in a newline!  You must ensure that's the case
    // (The Filigree class adds a newline at the end for you)
    nl: { match: /[ \t]*(?:#[^\n]*)?\n[ \t]*/, lineBreaks: true },

    // general string characters
    nonControlChars: /[^[/\]<.>=\n]/,  // not one of [ | ] < . > = \n

    //nl: { match: /[ \t]*\n[ \t]*/, lineBreaks: true },  // 
    //comment: /[ \t]*\/\/[^\n]*/,  // In other words, ws* "//" anything-but-newline*
    //_: /[ \t]+/,
});

export type FDecl = {
    kind: 'decl',
    name : string,
    value : FExpr,
}

export type FExpr =
    FSeq
  | FRef
  | FChoose
  | FLiteral

export type FSeq = {
    kind: 'seq',
    children: FExpr[],
}

export type FRef = {
    kind: 'ref',
    name : string,
    mods : string[],
}

export type FChoose = {
    kind: 'choose',
    children : FExpr[],
}

export type FLiteral = {
    kind: 'literal',
    text : string,
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


export interface Token { value: any; [key: string]: any };

export interface Lexer {
  reset: (chunk: string, info: any) => void;
  next: () => Token | undefined;
  save: () => any;
  formatError: (token: Token) => string;
  has: (tokenType: string) => boolean
};

export interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any
};

export type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

export var Lexer: Lexer | undefined = lexer;

export var ParserRules: NearleyRule[] = [
    {"name": "ruleDecls$ebnf$1", "symbols": []},
    {"name": "ruleDecls$ebnf$1", "symbols": ["ruleDecls$ebnf$1", (lexer.has("nl") ? {type: "nl"} : nl)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "ruleDecls$ebnf$2", "symbols": []},
    {"name": "ruleDecls$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "ruleDecls$ebnf$2$subexpression$1$ebnf$1", "symbols": ["ruleDecls$ebnf$2$subexpression$1$ebnf$1", (lexer.has("nl") ? {type: "nl"} : nl)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "ruleDecls$ebnf$2$subexpression$1", "symbols": ["ruleDecl", "ruleDecls$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "ruleDecls$ebnf$2", "symbols": ["ruleDecls$ebnf$2", "ruleDecls$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "ruleDecls", "symbols": ["ruleDecls$ebnf$1", "ruleDecls$ebnf$2"], "postprocess":  ([nl, pairs]) : FDecl[] => {
            return flatten(pairs).filter((x : any) => x.type !== 'nl');
        } },
    {"name": "ruleDecl", "symbols": [(lexer.has("ruleName") ? {type: "ruleName"} : ruleName), {"literal":" = "}, "seq"], "postprocess":  ([ruleName, _, seq]) : FDecl => ({
            kind: 'decl',
            name: ruleName.value,
            value: seq,
        }) },
    {"name": "seq$ebnf$1", "symbols": ["literal"], "postprocess": id},
    {"name": "seq$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "seq$ebnf$2", "symbols": []},
    {"name": "seq$ebnf$2$subexpression$1$ebnf$1", "symbols": ["literal"], "postprocess": id},
    {"name": "seq$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "seq$ebnf$2$subexpression$1", "symbols": ["tool", "seq$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "seq$ebnf$2", "symbols": ["seq$ebnf$2", "seq$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "seq", "symbols": ["seq$ebnf$1", "seq$ebnf$2"], "postprocess":  ([firstLiteral, pairs]) : FSeq => {
            // pairs is an array of [[tool], literal]
            // the literals are null if not present
            let sequence = [firstLiteral];
            for (let pair of pairs) {
                sequence.push(pair[0][0]);
                sequence.push(pair[1]);
            }
            return {
                kind: 'seq',
                children: sequence.filter(x => x !== null),
            };
        } },
    {"name": "tool", "symbols": ["ref"]},
    {"name": "tool", "symbols": ["chooseMultiLine"]},
    {"name": "tool", "symbols": ["chooseOneLine"]},
    {"name": "ref$ebnf$1", "symbols": []},
    {"name": "ref$ebnf$1$subexpression$1", "symbols": [(lexer.has("dot") ? {type: "dot"} : dot), (lexer.has("ruleName") ? {type: "ruleName"} : ruleName)]},
    {"name": "ref$ebnf$1", "symbols": ["ref$ebnf$1", "ref$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "ref", "symbols": [{"literal":"<"}, (lexer.has("ruleName") ? {type: "ruleName"} : ruleName), "ref$ebnf$1", {"literal":">"}], "postprocess":  (parts : any[]) : FRef => {
            parts = flatten(parts);
            parts = parts.slice(1, parts.length-1);  // remove < and >
            let name = parts.shift().value;
            let mods : string[] = [];
            while (parts.length > 0) {
                let mod = parts.shift();
                if (mod.type !== 'dot') {
                    mods.push(mod.value);
                }
            }
            return {
                kind: 'ref',
                name: name,
                mods: mods,
            };
        } },
    {"name": "chooseMultiLine$ebnf$1", "symbols": []},
    {"name": "chooseMultiLine$ebnf$1$subexpression$1", "symbols": [(lexer.has("nl") ? {type: "nl"} : nl), "seq"]},
    {"name": "chooseMultiLine$ebnf$1", "symbols": ["chooseMultiLine$ebnf$1", "chooseMultiLine$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "chooseMultiLine", "symbols": [{"literal":"["}, (lexer.has("nl") ? {type: "nl"} : nl), "seq", "chooseMultiLine$ebnf$1", (lexer.has("nl") ? {type: "nl"} : nl), {"literal":"]"}], "postprocess":  (parts: any[]) : FChoose => {
            let children = flatten(parts);
            //console.log('----------------\\');
            //console.log(JSON.stringify(children, null, 4));
            children = children.filter(child =>
                child !== null && child.type !== 'lbrak' && child.type !== 'nl' && child.type !== 'rbrak'
            );
            // remove empty lines
            children = children.filter(child =>
                !( child.kind === 'seq' && child.children.length === 0 )
                //&& ! (child.kind === 'seq' && child.children.length === 1 && child.children[0]
            );
            //console.log('----------------');
            //console.log(JSON.stringify(children, null, 4));
            //console.log('----------------/');
            return {
                kind: 'choose',
                children: children,
            };
        } },
    {"name": "chooseOneLine$ebnf$1", "symbols": []},
    {"name": "chooseOneLine$ebnf$1$subexpression$1", "symbols": [(lexer.has("or") ? {type: "or"} : or), "seq"]},
    {"name": "chooseOneLine$ebnf$1", "symbols": ["chooseOneLine$ebnf$1", "chooseOneLine$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "chooseOneLine", "symbols": [{"literal":"["}, "seq", "chooseOneLine$ebnf$1", {"literal":"]"}], "postprocess":  (parts: any[]) : FChoose => {
            let children = flatten(parts);
            children = children.filter(child =>
                child.type !== 'lbrak' && child.type !== 'or' && child.type !== 'rbrak'
            );
            return {
                kind: 'choose',
                children: children,
            };
        } },
    {"name": "literal$ebnf$1$subexpression$1", "symbols": [(lexer.has("ruleName") ? {type: "ruleName"} : ruleName)]},
    {"name": "literal$ebnf$1$subexpression$1", "symbols": [(lexer.has("dot") ? {type: "dot"} : dot)]},
    {"name": "literal$ebnf$1$subexpression$1", "symbols": [(lexer.has("nonControlChars") ? {type: "nonControlChars"} : nonControlChars)]},
    {"name": "literal$ebnf$1", "symbols": ["literal$ebnf$1$subexpression$1"]},
    {"name": "literal$ebnf$1$subexpression$2", "symbols": [(lexer.has("ruleName") ? {type: "ruleName"} : ruleName)]},
    {"name": "literal$ebnf$1$subexpression$2", "symbols": [(lexer.has("dot") ? {type: "dot"} : dot)]},
    {"name": "literal$ebnf$1$subexpression$2", "symbols": [(lexer.has("nonControlChars") ? {type: "nonControlChars"} : nonControlChars)]},
    {"name": "literal$ebnf$1", "symbols": ["literal$ebnf$1", "literal$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "literal", "symbols": ["literal$ebnf$1"], "postprocess":  (pieces) : FLiteral => {
            let text = pieces[0].map((p : any) => p[0].value).join('');
            return {kind: 'literal', text: text};
        }}
];

export var ParserStart: string = "ruleDecls";
