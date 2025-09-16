/**
 * A utility to extract and clean up entities from the NLP service response.
 */

// A simple function to parse numbers from strings, including written-out numbers.
const parseAmount = (amountStr) => {
    if (!amountStr) return null;

    // A simple map for written-out numbers
    const writtenNumbers = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'hundred': 100, 'thousand': 1000,
        // Add more as needed
    };

    const lowerCaseAmount = amountStr.toLowerCase();
    if (writtenNumbers[lowerCaseAmount]) {
        return writtenNumbers[lowerCaseAmount];
    }
    
    // Use regex to find the first sequence of digits in the string
    const match = amountStr.match(/\d+(\.\d+)?/);
    if (match) {
        return parseFloat(match[0]);
    }

    return null; // Return null if no number can be parsed
};


const extractEntities = (entities) => {
    const extracted = {
        amount: null,
        item: null,
        persons: [],
    };

    if (!entities || entities.length === 0) {
        return extracted;
    }

    // Find the first valid amount
    const amountEntity = entities.find(e => e.entity === 'AMOUNT');
    if (amountEntity) {
        extracted.amount = parseAmount(amountEntity.value);
    }
    
    // Find the first item
    const itemEntity = entities.find(e => e.entity === 'ITEM');
    if (itemEntity) {
        extracted.item = itemEntity.value;
    }

    // Find all persons
    extracted.persons = entities.filter(e => e.entity === 'PERSON').map(e => e.value);

    return extracted;
};

module.exports = {
    extractEntities,
};