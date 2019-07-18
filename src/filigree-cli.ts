import fs from 'fs';
import program from 'commander';
import {
    Filigree
} from './filigree';

let log = console.log;

let makeFilFromFileOrQuit = (fn : string, seed : string | undefined) : Filigree => {
    let source = fs.readFileSync(fn, 'utf8');
    let fil = new Filigree(source, seed);
    if (fil.err) {
        log('⚠️');
        console.error(fil.err.message);
        log('⚠️');
        process.exit(1);
    }
    return fil;
}

program
    .version('0.0.1')
    .arguments('<fn> [rule]')
    .option('-n, --num <n>', 'number to generate (if a rule is provided)', 1)
    .option('--seed <s>', 'random seed for deterministic output')
    .option('-s, --source', 'print source')
    .option('-r, --repr', 'print source in repr mode')
    .option('-j, --json', 'print raw rule JSON')
    .option('-g, --graph', 'generate a graph of rules and their dependencies in mermaid format')
    .action((fn, rule, options) => {
        let fil = makeFilFromFileOrQuit(fn, options.seed);
        if (!rule) {
            if (options.source) {
                log(fil.toString());
            } else if (options.repr) {
                log(fil.repr());
            } else if (options.json) {
                log(JSON.stringify(fil.rules, null, 4));
            } else if (options.graph) {
                let graph : string[] = [];
                graph.push('graph LR;');
                for (let ruleName of fil.ruleNames()) {
                    graph.push(`    ${ruleName};`);
                    for (let refdRuleName of fil.refsInRule(ruleName)) {
                        graph.push(`    ${ruleName}-->${refdRuleName};`);
                    }
                }
                log(graph.join('\n'));
            } else {
                log(fil.ruleNames().join('\n'));
            }
        } else {
            if (options.source) {
                log(rule + ' = ' + fil._toStringFExpr(fil.rules[rule]));
            } else if (options.repr) {
                log(rule + ' = ' + fil._reprFExpr(fil.rules[rule]));
            } else if (options.json) {
                log(JSON.stringify(fil.rules[rule], null, 4));
            } else {
                for (let ii = 0; ii < +options.num; ii++) {
                    log(fil.generate(rule));
                }
            }
        }
    });

program.parse(process.argv);
