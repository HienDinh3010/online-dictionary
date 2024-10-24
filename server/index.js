const express = require('express');

//GraphQL
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const cors = require('cors');
const popularSearches = new Map();

const dictionary = require('./englishdictionary.json'); // Load data from dictionary JSON file

const app = express();
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

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

      // Increment the popular search count
      if (popularSearches.has(word.toLowerCase())) {
        popularSearches.set(word.toLowerCase(), popularSearches.get(word.toLowerCase()) + 1);
      } else {
        popularSearches.set(word.toLowerCase(), 1);
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

require('dotenv').config(); 
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY  // Ensure your API key is correct in your .env file
});

// Example route
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100
    });

    // Send the generated text back to the client
    res.json({ text: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating text' });
  }
});

// Endpoint for generating audio
app.post('/generate-audio', async (req, res) => {
  const { input, voice } = req.body;  // Get input text and selected voice from the request

  if (!input || !voice) {
    return res.status(400).json({ error: 'Input text and voice are required.' });
  }

  try {
    // Call OpenAI's TTS API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',         // OpenAI's TTS model
      voice: voice,           // Pass in the selected voice
      input: input            // The text to convert to speech
    });

    // Get the audio as an array buffer
    const buffer = await mp3.arrayBuffer();

    // Set response headers and send audio file back
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buffer));  // Convert arrayBuffer to Buffer and send the audio data
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: 'Error generating audio.' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
