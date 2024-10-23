const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors');
const popularSearches = new Map();

const dictionary = require('./englishdictionary.json'); // Load data from dictionary JSON file

const app = express();

// Enable CORS
app.use(cors());

// GraphQL schema definition
const schema = buildSchema(`
  type Query {
    search(word: String!): [Definition]
    getPopularSearches: [String]
  }

  type Definition {
    word: String
    wordtype: String 
    definition: String
  }

  type Mutation {
    incrementPopularSearch(word: String!): String
  }
`);

// Resolver functions
const root = {
    search: ({ word }) => {
      if (!word) return [];  // Return an empty array if no word is provided
  
      // Ensure dictionary.entries exists and is an array
      if (!dictionary || !Array.isArray(dictionary.entries)) {
        throw new Error("Dictionary data is not loaded properly");
      }
  
      // Filter the dictionary entries by the provided word (case-insensitive)
      return dictionary.entries.filter((entry) =>
        entry.word && entry.word.toLowerCase() === word.toLowerCase()
      );
    },
    
    getPopularSearches: () => {
      return Array.from(popularSearches.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
    },
  
    incrementPopularSearch: ({ word }) => {
      if (popularSearches.has(word)) {
        popularSearches.set(word, popularSearches.get(word) + 1);
      } else {
        popularSearches.set(word, 1);
      }
      return word;
    }
  };
  

// GraphQL middleware
app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/graphql`);
});
