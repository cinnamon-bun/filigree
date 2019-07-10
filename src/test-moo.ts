import moo from 'moo';
let lexer = moo.compile({
    ruleName: /[a-zA-Z0-9_]+/,
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
    nonControlChars: /[^[/\]<>=\n]/,  // not one of [ / ] < > = \n

    //nl: { match: /[ \t]*\n[ \t]*/, lineBreaks: true },  // 
    //comment: /[ \t]*\/\/[^\n]*/,  // In other words, ws* "//" anything-but-newline*
    //_: /[ \t]+/,
});


let source = `
foo = [a/b] // comment
`;
lexer.reset(source);
console.log('---------------------');
console.log(source);
console.log();
for (let token of lexer) {
    console.log(JSON.stringify(token.value).padEnd(6), token.type);
}
console.log('---------------------');
