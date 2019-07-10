export declare type FDecl = {
    kind: 'decl';
    name: string;
    value: FExpr;
};
export declare type FExpr = FSeq | FRef | FChoose | FLiteral;
export declare type FSeq = {
    kind: 'seq';
    children: FExpr[];
};
export declare type FRef = {
    kind: 'ref';
    name: string;
};
export declare type FChoose = {
    kind: 'choose';
    children: FExpr[];
};
export declare type FLiteral = {
    kind: 'literal';
    text: string;
};
export interface Token {
    value: any;
    [key: string]: any;
}
export interface Lexer {
    reset: (chunk: string, info: any) => void;
    next: () => Token | undefined;
    save: () => any;
    formatError: (token: Token) => string;
    has: (tokenType: string) => boolean;
}
export interface NearleyRule {
    name: string;
    symbols: NearleySymbol[];
    postprocess?: (d: any[], loc?: number, reject?: {}) => any;
}
export declare type NearleySymbol = string | {
    literal: any;
} | {
    test: (token: any) => boolean;
};
export declare var Lexer: Lexer | undefined;
export declare var ParserRules: NearleyRule[];
export declare var ParserStart: string;
