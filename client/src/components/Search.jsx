import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';

// GraphQL query to search for a word
const SEARCH_WORD = gql`
  query Search($word: String!) {
    search(word: $word) {
      word
      wordtype
      definition
    }
  }
`;

const SearchComponent = () => {
  const [term, setTerm] = useState('');
  const [executeSearch, { data, loading, error }] = useLazyQuery(SEARCH_WORD);

  // Handle search submission
  const handleSearch = () => {
    if (term.trim()) {
      executeSearch({ variables: { word: term } });
    }
  };

  return (
    <div className="search-container">
      <label>Term:</label>
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Enter a word..."
      />
      <button onClick={handleSearch}>Lookup</button>

      {/* Display loading message */}
      {loading && <p>Loading...</p>}

      {/* Display error message if the search fails */}
      {error && <p>Error fetching word: {error.message}</p>}

      {/* Display search results */}
      {data && (
        <div className="results">
          <h3>Search Results:</h3>
          {data.search.length > 0 ? (
            data.search.map((definition, index) => (
              <div key={index}>
                <p>
                  <strong>{definition.wordtype}:</strong> {definition.definition}
                </p>
              </div>
            ))
          ) : (
            <p>No results found for "{term}"</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
