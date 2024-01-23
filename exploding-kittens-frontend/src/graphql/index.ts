import { ApolloClient, InMemoryCache, gql, DefaultOptions } from '@apollo/client';

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
  },
  query: {
    fetchPolicy: 'no-cache',
  },
}

export const apolloClient = new ApolloClient({
  uri: `${process.env.NEXT_PUBLIC_BACKEND_API}/graphql`,
  cache: new InMemoryCache(),
  defaultOptions
});

export const GET_USER_WITH_RANKINGS = gql`
      query GetUsersWithRankings {
        getUsersWithRanking {
          fromCache,
          results {
            _id,
            username,
            wins,
            ranking,
            rooms {
              _id,
              roomNumber
            }
          }
        }
      }
    `

export const UPDATE_USER = gql`
  mutation UpdateUser ($username: String!,$updateUserInput:UpdateUserInput) {
    updateUser(username: $username, updateUserInput: $updateUserInput) {
      _id,
      username,
      wins,
      rooms {
        _id,
        roomNumber
      }
    }
  }
`