@{%
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

%}

@preprocessor typescript

@lexer lexer

#@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
#@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives

ruleDecls -> %nl:* (ruleDecl %nl:*):*  {% ([nl, pairs]) : FDecl[] => {
    return flatten(pairs).filter((x : any) => x.type !== 'nl');
} %}

# foo = bar
ruleDecl -> %ruleName " = " seq  {% ([ruleName, _, seq]) : FDecl => ({
    kind: 'decl',
    name: ruleName.value,
    value: seq,
}) %}

# a<b>c
seq -> literal:? (tool literal:?):*  {% ([firstLiteral, pairs]) : FSeq => {
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
} %}

tool ->
    ref
  | choose

# <foo>
ref -> "<" %ruleName (%dot %ruleName):* ">"  {% (parts : any[]) : FRef => {
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
} %}

# [a|b]
choose -> "[" seq (%or seq):* "]"  {% (parts: any[]) : FChoose => {
    let children = flatten(parts);
    children = children.filter(child =>
        child.type !== 'lbrak' && child.type !== 'or' && child.type !== 'rbrak'
    );
    return {
        kind: 'choose',
        children: children,
    } as any;
} %}

# any other text
literal -> (%ruleName | %nonControlChars):+  {% (pieces) : FLiteral => {
    let text = pieces[0].map((p : any) => p[0].value).join('');
    return {kind: 'literal', text: text};
}%}










###  ruleDecl -> %ruleName " = " expr
###  # ruleName -> [a-zA-Z0-9_]:+
###  
###  expr -> 
###      choose
###    | ref
###    | string
###  
###  ref -> "<" %ruleName ">"
###  
###  choose -> "[" string ("|" string):* "]"
###  
###  
###  string -> strchar:+
###  strchar -> [^[|\]<>=]  # not one of [ | ] < > " " =
###  #strchar -> [a-zA-Z _"']

# csscolor -> "#" hexdigit hexdigit hexdigit hexdigit hexdigit hexdigit
#           | "#" hexdigit hexdigit hexdigit
#           | "rgb"  _ "(" _ colnum _ "," _ colnum _ "," _ colnum _ ")"
#           | "hsl"  _ "(" _ colnum _ "," _ colnum _ "," _ colnum _ ")"
#           | "rgba" _ "(" _ colnum _ "," _ colnum _ "," _ colnum _ "," _ decimal _ ")"
#           | "hsla" _ "(" _ colnum _ "," _ colnum _ "," _ colnum _ "," _ decimal _ ")"
# hexdigit -> [a-fA-F0-9]
# colnum   -> int | percentage
