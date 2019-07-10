"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const commander_1 = __importDefault(require("commander"));
const filigree_1 = require("./filigree");
let log = console.log;
let makeFilFromFileOrQuit = (fn) => {
    let source = fs_1.default.readFileSync(fn, 'utf8');
    let fil = new filigree_1.Filigree(source);
    if (fil.err) {
        log('⚠️');
        console.error(fil.err.message);
        log('⚠️');
        process.exit(1);
    }
    return fil;
};
commander_1.default
    .version('0.0.1')
    .arguments('<fn> [rule]')
    .option('-n, --num <n>', 'number to generate (if a rule is provided)', 5)
    .option('-s, --source', 'print source')
    .option('-r, --repr', 'print source in repr mode')
    .option('-j, --json', 'print raw rule JSON')
    .action((fn, rule, options) => {
    let fil = makeFilFromFileOrQuit(fn);
    if (!rule) {
        if (options.source) {
            log(fil.toString());
        }
        else if (options.repr) {
            log(fil.repr());
        }
        else if (options.json) {
            log(JSON.stringify(fil.rules, null, 4));
        }
        else {
            log(Object.keys(fil.rules).join('\n'));
        }
    }
    else {
        if (options.source) {
            log(rule + ' = ' + fil._toStringFExpr(fil.rules[rule]));
        }
        else if (options.repr) {
            log(rule + ' = ' + fil._reprFExpr(fil.rules[rule]));
        }
        else if (options.json) {
            log(JSON.stringify(fil.rules[rule], null, 4));
        }
        else {
            for (let ii = 0; ii < +options.num; ii++) {
                log(fil.generate(rule));
            }
        }
    }
});
commander_1.default.parse(process.argv);
