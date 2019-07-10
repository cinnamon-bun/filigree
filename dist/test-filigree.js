"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filigree_1 = require("./filigree");
let log = console.log;
/*
let wins = 0;
let losses = 0
let lose = (msg : string) => {
    losses += 1;
    log(`! lose: ${msg}`);
}
let win = (msg : string) => {
    wins += 1;
    log(`   win: ${msg}`);
}
let finished = () => {
    log(`${wins} wins`);
    log(`${losses} losses`);
}
let expectWork = (s : string) => {
    let parser = makeParser();
    try {
        parser.feed(s);
        if (parser.results.length == 0) {
            // bad, it failed with length zero
            lose(`should have worked: ${s}`);
            return;
        }
        // good, it returned something
        win(`worked: ${s}`);
    } catch (e) {
        // bad, it failed
        lose(`should have worked: ${s}`);
        throw e;
    }
}
let expectFail = (s : string) => {
    let parser = makeParser();
    try {
        parser.feed(s);
        if (parser.results.length == 0) {
            // good, it failed with length zero
            win(`correctly failed: ${s}`);
            return;
        }
        // bad, it returned something
        lose(`should have failed but didn't: ${s}`);
    } catch (e) {
        // good, it failed
        win(`correctly failed: ${s}`);
    }
}
*/
//let source = "greet = hello there[ <greet>|!]";
let source = `
    name = [sue/joe]  # comment
    greet =   hello <name>!  
    threespaces = [   ]
    empty1 = 
    empty2 = []
`;
let fil = new filigree_1.Filigree(source);
if (fil.err) {
    log('⚠️');
    console.error(fil.err.message);
    log('⚠️');
}
log('------------------------------');
log('--- source ---\n' + source);
log('--- toString ---\n' + fil.toString());
log('--- repr ---\n' + fil.repr());
log('------------------------------');
log(JSON.stringify(fil.rules, null, 4));
log('------------------------------');
log('--- generate ----');
for (let ii = 0; ii < 5; ii++) {
    log(fil.generate('greet'));
}
log('------------------------------');
/*
expectFail('foo');
expectFail('foo=');
expectFail('foo=a');
expectFail('foo = <a');
expectFail('foo = <|');
expectFail('foo = <|>');

expectWork('foo = ');
expectWork('foo = aa');
expectWork('foo = aa bb');
expectWork('foo = <aa>');
expectWork('foo = aa<bb>');
expectWork('foo = <aa>bb');
expectWork('foo = aa<bb>cc');
expectWork('foo = aa bb<cc>dd ee');
expectWork('foo = aa <bb> cc');

finished();
*/
//parser.feed("foo = bar a<baz>b");