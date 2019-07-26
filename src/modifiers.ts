import titlecase from 'titlecase';

// some of this was adapted from or inspired by Tracery's modifiers
// https://github.com/galaxykate/tracery/blob/master/js/tracery/modifiers.js

let repeatModUntilNoChange = (input : string, fn : (input : string) => string) => {
    let prev : string | null = null;
    while (prev !== input) {
        prev = input;
        input = fn(input);
    }
    return input;
};

let isVowel = (char : string) : boolean => {
    char = char.toLowerCase();
    return char === 'a' || char === 'e' || char === 'i' || char === 'o' || char === 'u';
}

let endsWithAny = (input : string, suffixes : string[]) : boolean => {
    // does the string end with any of the suffixes?
    for (let suf of suffixes) {
        if (input.endsWith(suf)) { return true; }
    }
    return false;
}

let endsWithConY = (input : string) : boolean => {
    // does the string end with a consonant and then a y?
    if (input.length < 2) { return false; }
    return (input[input.length-1] === 'y' && ! isVowel(input[input.length-2]));
}

let pluralize = (input : string) : string => {
    // convert a word to its plural form
    // TODO: match case of the original?
    if (input === '') { return input; }
    let i = input.toLowerCase();
    if (endsWithAny(i, ['s', 'sh', 'ch', 'x', 'z', 'o'])) { 
        return input + 'es';
    }
    if (endsWithConY(i)) {
        return input.slice(0, input.length-1) + 'ies';
    }
    return input + 's';
}

export let makeModifiers = () => ({
    s: pluralize,
    a: (input : string) => {
        if (input === '') { return input; }
        if (isVowel(input[0])) { return 'an ' + input; }
        return 'a ' + input;
    },

    trim: (input : string) => input.trim(),
    mergeSpaces: (input : string) => {
        // replace consecutive spaces with one space
        return repeatModUntilNoChange(input, (input) => {
            return input.split('  ').join(' ');
        });
    },

    uppercase: (input : string) => input.toUpperCase(),
    lowercase: (input : string) => input.toLowerCase(),
    titlecase: (input : string) => titlecase(input),
    sentencecase: (input : string) => {
        // capitalize first character only
        if (input === '') { return input; }
        return input[0].toUpperCase() + input.slice(1);
    },

    inception: (input : string) => input.toUpperCase().split('').join(' '),  // "hello" -> "H E L L O"
    wackycase: (input : string) => {
        // "hello" -> "hElLo"
        let result : string[] = [];
        for (let ii = 0; ii < input.length; ii++) {
            if (ii % 2 === 0) { result.push(input[ii].toLowerCase()); }
            else { result.push(input[ii].toUpperCase()) }
        }
        return result.join('');
    },
});
