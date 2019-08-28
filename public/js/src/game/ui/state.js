/*
    Functions for building a state table for every turn
*/

// Imports
const globals = require('./globals');

// Define a command handler map
const commands = {};

// A player just gave a clue
// {clue: {type: 0, value: 1}, giver: 1, list: [11], target: 2, turn: 0, type: "clue"}
commands.clue = (data) => {
    globals.state.clueTokens -= 1;
    globals.state.clues.push({
        type: data.clue.type,
        value: data.clue.value,
        giver: data.giver,
        target: data.target,
        turn: data.turn,
    });

    for (const order of globals.state.hands[data.target]) {
        const card = globals.state.deck[order];
        card.clues.push({
            type: data.clue.type,
            value: data.clue.value,
            positive: data.list.includes(order),
        });
    }
};

// The game is over and the server gave us a list of every card in the deck
// {deck: [{suit: 0, rank 1}, {suit: 2, rank: 2}, ...], type: "deckOrder", }
commands.deckOrder = (data) => {
    globals.deckOrder = data.deck;
};

// A player just discarded a card
// {failed: false, type: "discard", which: {index: 0, order: 4, rank: 1, suit: 2}}
commands.discard = (data) => {
    // Reveal all cards discarded
    const card = globals.state.deck[data.which.order];
    card.suit = data.which.suit;
    card.rank = data.which.rank;

    // Remove it from the hand
    const hand = globals.state.hands[data.which.index];
    const handIndex = hand.indexOf(data.which.order);
    if (handIndex !== -1) {
        hand.splice(handIndex, 1);
    }

    // Add it to the discard stacks
    globals.state.discardStacks[card.suit].push(data.which.order);
};

// A player just drew a card from the deck
// {order: 0, rank: 1, suit: 4, type: "draw", who: 0}
commands.draw = (data) => {
    globals.state.deckSize -= 1;
    globals.state.deck[data.order] = {
        suit: data.suit,
        rank: data.rank,
        clues: [],
    };
    globals.state.hands[data.who].push(data.order);
};

// A player just played a card
// {type: "play", which: {index: 0, order: 4, rank: 1, suit: 2}}
// (index is the player index)
commands.play = (data) => {
    // Reveal all cards played
    const card = globals.state.deck[data.which.order];
    card.suit = data.which.suit;
    card.rank = data.which.rank;

    // Remove it from the hand
    const hand = globals.state.hands[data.which.index];
    const handIndex = hand.indexOf(data.which.order);
    if (handIndex !== -1) {
        hand.splice(handIndex, 1);
    }

    // Add it to the play stacks
    globals.state.playStacks[card.suit].push(data.which.order);
};

// An action has been taken, so there may be a change to game state variables
// {clues: 5, doubleDiscard: false, maxScore: 24, score: 18, type: "status"}
commands.status = (data) => {
    globals.state.clueTokens = data.clues;
    globals.state.doubleDiscard = data.doubleDiscard;
    globals.state.maxScore = data.maxScore;
    globals.state.score = data.score;
};

// A player failed to play a card
// {num: 1, order: 24, turn: 32, type: "strike"}
commands.strike = (data) => {
    globals.state.strikes = data.num;
    const i = data.num - 1;

    // We also keep track of the strikes outside of the state object so that we can show a faded X
    globals.strikes[i] = {
        order: data.order,
        turn: data.turn,
    };
};

// A line of text was recieved from the server
// {text: "Razgovor plays Black 2 from slot #1", type: "text"}
commands.text = (data) => {
    globals.state.log.push(data.text);
};

// It is now a new turn
// {num: 0, type: "turn", who: 1}
commands.turn = (data) => {
    globals.state.currentPlayerIndex = data.who;

    // Make a copy of the current state and store it in the state table
    globals.states[data.num] = JSON.parse(JSON.stringify(globals.state));
};

module.exports = commands;