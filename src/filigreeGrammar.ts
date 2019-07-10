// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var nl: any;
declare var ruleName: any;
declare var or: any;
declare var nonControlChars: any;

let moo = require('moo');
let lexer = moo.compile({
    ruleName: /[a-zA-Z0-9_-]+/,
    eq: " = ",
    lbrak: "[",
    rbrak: "]",
    lang: "<",
    rang: ">",
    or: "/",
    // ignorable noise between lines:
    // optional whitespace
    // optional comment to the end of the line (starting with "#")
    // a required newline
    // optional whitespace starting the next line
    // This assumes the string ends in a newline!  You must ensure that's the case
    // (The Filigree class adds a newline at the end for you)
    nl: { match: /[ \t]*(?:#[^\n]*)?\n[ \t]*/, lineBreaks: true },

    // general string characters
    nonControlChars: /[^[/\]<>=\n]/,  // not one of [ | ] < > = \n

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
    {"name": "tool", "symbols": ["choose"]},
    {"name": "ref", "symbols": [{"literal":"<"}, (lexer.has("ruleName") ? {type: "ruleName"} : ruleName), {"literal":">"}], "postprocess": ([l, n, r]) : FRef => ({kind: 'ref', name: n.value})},
    {"name": "choose$ebnf$1", "symbols": []},
    {"name": "choose$ebnf$1$subexpression$1", "symbols": [(lexer.has("or") ? {type: "or"} : or), "seq"]},
    {"name": "choose$ebnf$1", "symbols": ["choose$ebnf$1", "choose$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "choose", "symbols": [{"literal":"["}, "seq", "choose$ebnf$1", {"literal":"]"}], "postprocess":  (parts: any[]) : FChoose => {
            let children = flatten(parts);
            children = children.filter(child =>
                child.type !== 'lbrak' && child.type !== 'or' && child.type !== 'rbrak'
            );
            return {
                kind: 'choose',
                children: children,
            } as any;
        } },
    {"name": "literal$ebnf$1$subexpression$1", "symbols": [(lexer.has("ruleName") ? {type: "ruleName"} : ruleName)]},
    {"name": "literal$ebnf$1$subexpression$1", "symbols": [(lexer.has("nonControlChars") ? {type: "nonControlChars"} : nonControlChars)]},
    {"name": "literal$ebnf$1", "symbols": ["literal$ebnf$1$subexpression$1"]},
    {"name": "literal$ebnf$1$subexpression$2", "symbols": [(lexer.has("ruleName") ? {type: "ruleName"} : ruleName)]},
    {"name": "literal$ebnf$1$subexpression$2", "symbols": [(lexer.has("nonControlChars") ? {type: "nonControlChars"} : nonControlChars)]},
    {"name": "literal$ebnf$1", "symbols": ["literal$ebnf$1", "literal$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "literal", "symbols": ["literal$ebnf$1"], "postprocess":  (pieces) : FLiteral => {
            let text = pieces[0].map((p : any) => p[0].value).join('');
            return {kind: 'literal', text: text};
        }}
];

export var ParserStart: string = "ruleDecls";