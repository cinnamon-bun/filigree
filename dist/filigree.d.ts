import { FExpr } from './filigreeGrammar';
export declare class Filigree {
    rules: {
        [name: string]: FExpr;
    };
    err: Error | null;
    constructor(source: string);
    generate(name: string): string;
    toString(): string;
    repr(): string;
    _renderRules(fn: (x: FExpr) => string): string;
    _toStringFExpr(expr: FExpr): string;
    _reprFExpr(expr: FExpr): string;
    _evalFExpr(expr: FExpr): string;
}
