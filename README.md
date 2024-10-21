# Dice Betting API

## Description
This project is a dice betting API built as part of the Technical Test at AG for Senior Backend Engineer Position. It allows to place bets and calculates payouts based on a random chance, also query users and bets. The API is built using **NestJS**, **GraphQL**, **TypeScript**, **Sequelize**, and includes **PostgreSQL** for database management and **Redis** for distributed locks.

## Technologies Used
- **TypeScript**
- **NestJS**
- **GraphQL**
- **Sequelize**
- **PostgreSQL**
- **Redis**
- **Docker**

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/agustintosco/ag-api-assignment
   ```

2. **Navigate to the project directory**:
    ``` bash
    cd ag-api-assignment
    ```

3. **Run this command**:

    This command will set up the app, the PostgreSQL database, and a Redis server.

    ``` bash
    npm run start:app
    ```

  - Requirements:
    - docker
    - docker-compose

## API Access
 
Once the server is running, you can access the GraphQL Playground at:

`http://localhost:3000/graphql`

## API Documentation

### Queries

1. **getBetList**: Retrieves a paginated list of bets.
   - **Arguments**:
     - `first` (Int, optional): The number of results to return.
     - `after` (String, optional): Cursor for pagination.
   - **Returns**: A `Connection` object with `edges` and `pageInfo` for pagination.

   Example query:
   ```graphql
   query {
     getBetList(first: 10, after: "cursorValue") {
       edges {
         node {
           id
           betAmount
           payout
         }
       }
       pageInfo {
         hasNextPage
         endCursor
       }
     }
   }
   ```

2. **getBet**: Retrieves a specific bet by its ID.
   - **Arguments**:
      - `id` (Int): The ID of the bet.
   - **Returns**: A Bet object with details of the bet.

   Example query:
   ```graphql
   query {
     getBet(id: 1) {
       id
       betAmount
       win
       payout
       user {
        name
       }
     }
   }
   ```

3. **getBestBetPerUser**: Retrieves the best bet for each user, with an option to limit the results.
    - **Arguments**:
      - `limit` (Int): The maximum number of users to return.
    - **Returns**: A list of Bet objects representing the best bet for each user.

    Example query:
    ```graphql
    query {
      getBestBetPerUser(limit: 5) {
        id
        payout
        user {
         name
        }
      }
    }
    ```

4. **getUser**: Retrieves a specific user by their ID.
    - **Arguments**:
      - `id` (Int): The ID of the user.
    - **Returns**: A User object.

    Example query:
    ```graphql
    query {
      getUser(id: 1) {
        id
        name
        balance
        bets {
          chance
          win
        }
      }
    }
    ```

5. **getUserList**: Retrieves a paginated list of users.
    - **Arguments**:
      - `limit` (Int, optional): The number of users to return (default is 10).
      - `offset` (Int, optional): The number of users to skip for pagination.
    - **Returns**: A list of User objects and a boolean indicating if there's a next page.

    Example query:
    ```graphql
    query {
      getUserList(limit: 10, offset: 0) {
        users {
          id
          name
          balance
          bets {
            payout
            chance
          }
        }
        hasNextPage
      }
    }
    ```

### Mutations

6. **createBet**: Creates a new bet for a user.
    - **Arguments**:
      - `userId` (Int): The ID of the user placing the bet.
      - `betAmount` (Float): The amount of money being bet.
      - `chance` (Float): The chance (probability) of winning, passed as a decimal.
    - **Returns**: The created Bet object.

    Example mutation:
    ```graphql
    mutation {
      createBet(userId: 1, betAmount: 100.0, chance: 0.5) {
        id
        betAmount
        win
        payout
      }
    }
    ```

## Testing
- Basic Unit Tests were added for `UserService` and `BetService` to ensure that main logic works correctly.
- To run the unit tests:
  ```bash
  npm run test
  ```

## Notes:
1. For simplicity no repository separated classes were used.
2. Basic error mapping for covering possible errors.

## Future Improvements
- Add integration and end-to-end tests.
- Implement user authentication and authorization to restrict access to the API.
- Add advanced error handling and custom error messages for better user experience.
- Add filtering and sorting to list Queries.
- Include global logger.
